import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'bluecomputer.settings')
django.setup()

from django.test import TestCase, Client
from django.utils import timezone
from decimal import Decimal
import json

from store.models import Category, Brand, Product, ProductIMEI, Order, OrderItem, DailyLedger, SyncEvent
from store.khqr import build_emvco_khqr_string, generate_khqr_image_base64

class OmnichannelWorkflowTestCase(TestCase):
    def setUp(self):
        self.client = Client()
        self.category = Category.objects.create(name='Smartphones', slug='smartphones')
        self.brand = Brand.objects.create(name='Apple', slug='apple')
        
        # Create a test phone with 3 IMEIs
        self.product = Product.objects.create(
            name='iPhone 15 Pro 128GB - Blue Titanium',
            slug='iphone-15-pro-128gb-blue-titanium',
            brand=self.brand,
            category=self.category,
            barcode='195949000111',
            sku='IP15P-128-BLU',
            wholesale_price=Decimal('850.00'),
            retail_price=Decimal('999.00'),
            discount_price=Decimal('969.00'),
            requires_imei=True
        )

        self.imei1 = ProductIMEI.objects.create(product=self.product, imei='351111111111111', status='AVAILABLE')
        self.imei2 = ProductIMEI.objects.create(product=self.product, imei='351111111111112', status='AVAILABLE')
        self.imei3 = ProductIMEI.objects.create(product=self.product, imei='351111111111113', status='AVAILABLE')

        # Create accessory
        self.case = Product.objects.create(
            name='Clear MagSafe Case',
            slug='clear-magsafe-case',
            brand=self.brand,
            category=self.category,
            barcode='195949000222',
            sku='CASE-MAG-CLR',
            wholesale_price=Decimal('10.00'),
            retail_price=Decimal('25.00'),
            requires_imei=False,
            accessory_stock=20
        )

    def test_workflow_1_initial_stock_and_catalog(self):
        """Workflow 1 Check: Central stock is calculated correctly from IMEIs"""
        self.assertEqual(self.product.current_stock, 3)
        self.assertEqual(self.product.effective_price, Decimal('969.00'))
        self.assertEqual(self.case.current_stock, 20)

        # Fetch Catalog API
        res = self.client.get('/api/products/')
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(len(data), 2)
        phone_data = next(p for p in data if p['id'] == self.product.id)
        self.assertEqual(phone_data['current_stock'], 3)
        self.assertIn('351111111111111', phone_data['available_imeis'])

    def test_workflow_2_pos_cashier_sale_and_imei_deduction(self):
        """Workflow 2: Barcode scan, POS Sale, IMEI assignment, and Ledger Update"""
        # 1. Barcode lookup
        res_lookup = self.client.get('/api/pos/lookup/?code=195949000111')
        self.assertEqual(res_lookup.status_code, 200)
        self.assertEqual(res_lookup.json()['product']['name'], self.product.name)

        # 2. Complete POS Sale with 1 iPhone + 1 Case, assigning imei1
        pos_payload = {
            'customer_name': 'In-Store Walk-in',
            'payment_method': 'ABA_PAY',
            'discount_amount': 20.00,
            'cashier_name': 'Station 01',
            'items': [
                {
                    'product_id': self.product.id,
                    'quantity': 1,
                    'unit_price': 969.00,
                    'selected_imeis': ['351111111111111']
                },
                {
                    'product_id': self.case.id,
                    'quantity': 1,
                    'unit_price': 25.00,
                    'selected_imeis': []
                }
            ]
        }

        res_checkout = self.client.post(
            '/api/pos/checkout/', 
            data=json.dumps(pos_payload), 
            content_type='application/json'
        )
        self.assertEqual(res_checkout.status_code, 201)
        checkout_data = res_checkout.json()
        self.assertTrue(checkout_data['success'])
        self.assertEqual(Decimal(str(checkout_data['total_amount'])), Decimal('974.00')) # (969 + 25) - 20

        # Verify stock and IMEI status
        self.imei1.refresh_from_db()
        self.assertEqual(self.imei1.status, 'SOLD_POS')
        self.assertIsNotNone(self.imei1.sold_date)
        
        self.product.refresh_from_db()
        self.assertEqual(self.product.current_stock, 2) # 3 - 1 = 2

        self.case.refresh_from_db()
        self.assertEqual(self.case.accessory_stock, 19) # 20 - 1 = 19

        # Verify Daily Ledger
        today = timezone.localdate()
        ledger = DailyLedger.objects.get(date=today)
        self.assertEqual(ledger.aba_sales, Decimal('974.00'))
        self.assertEqual(ledger.order_count, 1)

    def test_workflow_3_bakong_khqr_scan_and_mobile_pay(self):
        """Workflow 3: EMVCo Bakong KHQR generation, dynamic QR image, and mobile scan payment approval"""
        # 1. Generate KHQR for $1,159
        khqr_str = build_emvco_khqr_string(
            merchant_name="BLUE COMPUTER",
            account_id="bluecomputer@abab",
            amount=Decimal('1159.00'),
            currency="USD",
            bill_number="BC-TEST-1001"
        )
        self.assertTrue(khqr_str.startswith("000201010212"))
        self.assertIn("BLUE COMPUTER", khqr_str)
        self.assertIn("1159.00", khqr_str)

        # 2. Test QR image generator
        img_b64 = generate_khqr_image_base64(khqr_str)
        self.assertTrue(img_b64.startswith("data:image/png;base64,"))

        # 3. Create online order and approve via mobile scan endpoint
        online_payload = {
            'customer_name': 'Sokha Chan',
            'customer_phone': '012 888 999',
            'delivery_city': 'Phnom Penh',
            'delivery_district': 'Toul Kork',
            'delivery_address': 'St 598, House #42',
            'payment_method': 'ABA_PAY',
            'items': [{'product_id': self.product.id, 'quantity': 1}]
        }
        res_order = self.client.post('/api/ecommerce/checkout/', data=json.dumps(online_payload), content_type='application/json')
        order_num = res_order.json()['order_number']

        # Check KHQR status initially PENDING
        res_status = self.client.get(f'/api/payment/khqr/status/{order_num}/')
        self.assertEqual(res_status.json()['payment_status'], 'PENDING')

        # Customer scans and approves on phone
        res_approve = self.client.post(f'/api/payment/khqr/approve/{order_num}/')
        self.assertEqual(res_approve.status_code, 200)
        self.assertEqual(res_approve.json()['status'], 'PAID')

        # Verify status is now PAID
        res_status_after = self.client.get(f'/api/payment/khqr/status/{order_num}/')
        self.assertEqual(res_status_after.json()['payment_status'], 'PAID')

    def test_workflow_admin_add_stock(self):
        """Admin inventory stock-in: Registering new device with 2 IMEIs"""
        new_prod_payload = {
            'name': 'Samsung Galaxy S24+ 256GB - Onyx Black',
            'brand_id': self.brand.id,
            'category_id': self.category.id,
            'sku': 'SM-S926B-256',
            'barcode': '880609599999',
            'wholesale_price': 800.00,
            'retail_price': 999.00,
            'discount_price': 949.00,
            'requires_imei': True,
            'imeis': '359999999999001\n359999999999002'
        }

        res_add = self.client.post(
            '/api/admin/products/manage/', 
            data=json.dumps(new_prod_payload), 
            content_type='application/json'
        )
        self.assertEqual(res_add.status_code, 201)
        self.assertEqual(res_add.json()['current_stock'], 2)
