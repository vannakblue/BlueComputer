from django.shortcuts import render, get_object_or_404
from django.db import transaction
from django.db.models import Sum, Count, Q, F
from django.utils import timezone
from django.http import JsonResponse, HttpResponse
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from decimal import Decimal
import json
import uuid
from datetime import date

from .models import Category, Brand, Product, ProductIMEI, Order, OrderItem, DailyLedger, SyncEvent
from .serializers import (
    CategorySerializer, BrandSerializer, ProductListSerializer, 
    ProductDetailSerializer, OrderSerializer, DailyLedgerSerializer, 
    SyncEventSerializer, ProductIMEISerializer
)
from .khqr import build_emvco_khqr_string, generate_khqr_image_base64


# ==========================================
# HTML Template Views
# ==========================================

def ecommerce_view(request):
    """Public E-commerce Storefront for Blue Computer"""
    return render(request, 'ecommerce.html')

def pos_view(request):
    """Cashier In-Store POS Screen"""
    return render(request, 'pos.html')

def admin_portal_view(request):
    """Manager Inventory & Daily Ledger Portal"""
    return render(request, 'admin_portal.html')

def order_tracking_view(request, order_number=None):
    """Customer Live Order Tracking"""
    return render(request, 'order_tracking.html', {'order_number': order_number or ''})

def khqr_mobile_pay_view(request, order_number):
    """Mobile Web Banking landing page when customer scans the KHQR with phone"""
    order = get_object_or_404(Order, order_number=order_number)
    khr_amount = int(order.total_amount * Decimal('4100'))
    return render(request, 'khqr_mobile_pay.html', {
        'order': order,
        'khr_amount': f"{khr_amount:,}"
    })


# ==========================================
# Bakong KHQR & Real Scan Payment APIs
# ==========================================

class GenerateKHQRAPIView(APIView):
    """
    Generates authentic EMVCo Bakong KHQR string, dynamic QR image base64,
    and mobile scan landing URL for real-time payments.
    """
    def post(self, request):
        order_number = request.data.get('order_number')
        amount = Decimal(str(request.data.get('amount', 0)))
        currency = request.data.get('currency', 'USD')
        
        if order_number:
            order = Order.objects.filter(order_number=order_number).first()
            if order:
                amount = order.total_amount
        else:
            order_number = f"POS-QR-{uuid.uuid4().hex[:6].upper()}"

        khqr_string = build_emvco_khqr_string(
            merchant_name="BLUE COMPUTER",
            account_id="bluecomputer@abab",
            amount=amount,
            currency=currency,
            bill_number=order_number,
            city="Phnom Penh"
        )

        qr_image_base64 = generate_khqr_image_base64(khqr_string)
        khr_amount = int(amount * Decimal('4100'))
        
        # Build local mobile scanning URL
        host = request.get_host()
        pay_url = f"http://{host}/pay/khqr/{order_number}/"

        return Response({
            'order_number': order_number,
            'amount_usd': str(amount),
            'amount_khr': f"{khr_amount:,}",
            'khqr_string': khqr_string,
            'qr_image_base64': qr_image_base64,
            'mobile_pay_url': pay_url,
            'expires_in_seconds': 180
        })


class ApproveKHQRPaymentAPIView(APIView):
    """
    Called when customer scans and taps 'Confirm Payment' on their phone
    """
    @transaction.atomic
    def post(self, request, order_number):
        order = Order.objects.filter(order_number=order_number).first()
        if not order:
            return Response({'error': 'Order not found'}, status=status.HTTP_404_NOT_FOUND)

        order.payment_status = 'PAID'
        order.payment_reference = f"ABA-TXN-{uuid.uuid4().hex[:8].upper()}"
        order.save()

        # Update Daily Ledger
        today = timezone.localdate()
        ledger, _ = DailyLedger.objects.get_or_create(date=today)
        ledger.aba_sales += order.total_amount
        ledger.total_revenue += order.total_amount
        ledger.total_cost += order.total_cost
        ledger.total_profit = max(Decimal('0.00'), ledger.total_revenue - ledger.total_cost)
        ledger.save()

        # Broadcast real-time payment success sync event
        SyncEvent.objects.create(
            event_type='PAYMENT_SUCCESS',
            payload={
                'order_number': order.order_number,
                'total_amount': str(order.total_amount),
                'channel': order.channel,
                'payment_reference': order.payment_reference
            }
        )

        return Response({
            'success': True,
            'message': 'Payment approved successfully via ABA Mobile!',
            'order_number': order.order_number,
            'payment_reference': order.payment_reference,
            'status': order.payment_status
        })


class CheckKHQRStatusAPIView(APIView):
    """
    Polled every 1s by POS Cashier and E-Commerce checkout to detect mobile customer payment
    """
    def get(self, request, order_number):
        order = Order.objects.filter(order_number=order_number).first()
        if not order:
            return Response({'error': 'Order not found'}, status=status.HTTP_404_NOT_FOUND)

        return Response({
            'order_number': order.order_number,
            'payment_status': order.payment_status,
            'payment_method': order.payment_method,
            'fulfillment_status': order.fulfillment_status,
            'total_amount': str(order.total_amount),
            'receipt_data': OrderSerializer(order).data if order.payment_status == 'PAID' else None
        })


# ==========================================
# Catalog & Search APIs
# ==========================================

class ProductCatalogAPIView(APIView):
    """List & Filter Products for E-Commerce and POS"""
    def get(self, request):
        queryset = Product.objects.filter(is_active=True).select_related('brand', 'category').prefetch_related('imeis')
        
        search = request.GET.get('search', '').strip()
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(sku__icontains=search) |
                Q(barcode__icontains=search) |
                Q(brand__name__icontains=search) |
                Q(category__name__icontains=search)
            )
            
        brand_slug = request.GET.get('brand')
        if brand_slug and brand_slug != 'all':
            queryset = queryset.filter(brand__slug=brand_slug)
            
        cat_slug = request.GET.get('category')
        if cat_slug and cat_slug != 'all':
            queryset = queryset.filter(category__slug=cat_slug)
            
        if request.GET.get('featured') == 'true':
            queryset = queryset.filter(is_featured=True)
            
        min_price = request.GET.get('min_price')
        max_price = request.GET.get('max_price')
        if min_price:
            queryset = queryset.filter(retail_price__gte=Decimal(min_price))
        if max_price:
            queryset = queryset.filter(retail_price__lte=Decimal(max_price))

        ordering = request.GET.get('ordering', '-created_at')
        if ordering in ['retail_price', '-retail_price', 'name', '-name', '-created_at']:
            queryset = queryset.order_by(ordering)

        serializer = ProductListSerializer(queryset, many=True)
        return Response(serializer.data)


class ProductDetailAPIView(APIView):
    """Product Detail with active IMEIs and specifications"""
    def get(self, request, pk_or_slug):
        try:
            if pk_or_slug.isdigit():
                product = Product.objects.get(pk=int(pk_or_slug))
            else:
                product = Product.objects.get(slug=pk_or_slug)
        except Product.DoesNotExist:
            return Response({'error': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)
            
        serializer = ProductDetailSerializer(product)
        return Response(serializer.data)


class CategoryListAPIView(APIView):
    def get(self, request):
        categories = Category.objects.all()
        return Response(CategorySerializer(categories, many=True).data)


class BrandListAPIView(APIView):
    def get(self, request):
        brands = Brand.objects.all()
        return Response(BrandSerializer(brands, many=True).data)


# ==========================================
# Inventory Management APIs (Admin / Manager)
# ==========================================

class InventoryDashboardStatsAPIView(APIView):
    """KPI Metrics for Manager Dashboard"""
    def get(self, request):
        products = Product.objects.filter(is_active=True).prefetch_related('imeis')
        
        total_products = products.count()
        total_units = 0
        total_wholesale_value = Decimal('0.00')
        total_retail_value = Decimal('0.00')
        low_stock_list = []

        for p in products:
            stock = p.current_stock
            total_units += stock
            total_wholesale_value += (p.wholesale_price * Decimal(stock))
            total_retail_value += (p.effective_price * Decimal(stock))
            if stock <= 3:
                low_stock_list.append({
                    'id': p.id,
                    'name': p.name,
                    'stock': stock,
                    'sku': p.sku,
                    'category': p.category.name
                })

        potential_profit = max(Decimal('0.00'), total_retail_value - total_wholesale_value)

        today = timezone.localdate()
        today_orders = Order.objects.filter(created_at__date=today, payment_status='PAID')
        today_sales = today_orders.aggregate(total=Sum('total_amount'))['total'] or Decimal('0.00')
        today_profit = sum(o.total_profit for o in today_orders) if today_orders.exists() else Decimal('0.00')

        return Response({
            'total_products': total_products,
            'total_units_in_stock': total_units,
            'total_wholesale_value': total_wholesale_value,
            'total_retail_value': total_retail_value,
            'potential_gross_profit': potential_profit,
            'low_stock_count': len(low_stock_list),
            'low_stock_items': low_stock_list[:10],
            'today_sales': today_sales,
            'today_profit': today_profit,
            'today_order_count': today_orders.count()
        })


class ProductManagementAPIView(APIView):
    """Add new product or receive batch stock with IMEIs"""
    @transaction.atomic
    def post(self, request):
        data = request.data
        try:
            name = data.get('name')
            brand_id = data.get('brand_id')
            category_id = data.get('category_id')
            barcode = data.get('barcode', '').strip()
            sku = data.get('sku', '').strip()
            wholesale_price = Decimal(str(data.get('wholesale_price', 0)))
            retail_price = Decimal(str(data.get('retail_price', 0)))
            discount_price = Decimal(str(data.get('discount_price', 0))) if data.get('discount_price') else None
            requires_imei = str(data.get('requires_imei', 'true')).lower() in ['true', '1', 'yes']
            accessory_stock = int(data.get('accessory_stock', 0))
            color = data.get('color', '')
            storage = data.get('storage', '')
            image_url = data.get('image_url', '')
            description = data.get('description', '')
            specs = data.get('specs', {})

            if isinstance(specs, str):
                try:
                    specs = json.loads(specs)
                except:
                    specs = {}

            if not sku:
                sku = f"BC-{uuid.uuid4().hex[:6].upper()}"
            if not barcode:
                barcode = f"885{uuid.uuid4().hex[:9]}"

            slug = f"{name.lower().replace(' ', '-')}-{uuid.uuid4().hex[:4]}"

            product = Product.objects.create(
                name=name,
                slug=slug,
                brand_id=brand_id,
                category_id=category_id,
                barcode=barcode,
                sku=sku,
                color=color,
                storage=storage,
                wholesale_price=wholesale_price,
                retail_price=retail_price,
                discount_price=discount_price,
                requires_imei=requires_imei,
                accessory_stock=accessory_stock if not requires_imei else 0,
                image_url=image_url,
                description=description,
                specs=specs,
                is_featured=data.get('is_featured', False),
                is_active=True
            )

            imeis_input = data.get('imeis', [])
            if isinstance(imeis_input, str):
                imeis_raw = [x.strip() for x in imeis_input.replace('\n', ',').split(',') if x.strip()]
            else:
                imeis_raw = imeis_input

            added_imeis = []
            for im in imeis_raw:
                im_clean = str(im).strip()
                if im_clean and not ProductIMEI.objects.filter(imei=im_clean).exists():
                    ProductIMEI.objects.create(
                        product=product,
                        imei=im_clean,
                        status='AVAILABLE'
                    )
                    added_imeis.append(im_clean)

            SyncEvent.objects.create(
                event_type='STOCK_UPDATE',
                payload={'product_id': product.id, 'name': product.name, 'stock': product.current_stock}
            )

            return Response({
                'success': True,
                'message': f"Product '{product.name}' created successfully with {product.current_stock} units in stock.",
                'product_id': product.id,
                'current_stock': product.current_stock,
                'added_imeis_count': len(added_imeis)
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class BatchIMEIReceiveAPIView(APIView):
    """Add additional stock / IMEIs to existing product"""
    @transaction.atomic
    def post(self, request, product_id):
        product = get_object_or_404(Product, pk=product_id)
        data = request.data
        imeis_input = data.get('imeis', '')
        accessory_quantity = int(data.get('accessory_quantity', 0))

        if product.requires_imei:
            if isinstance(imeis_input, str):
                imei_list = [x.strip() for x in imeis_input.replace('\n', ',').split(',') if x.strip()]
            else:
                imei_list = imeis_input

            added = 0
            duplicates = 0
            for im in imei_list:
                if ProductIMEI.objects.filter(imei=im).exists():
                    duplicates += 1
                else:
                    ProductIMEI.objects.create(product=product, imei=im, status='AVAILABLE')
                    added += 1
            msg = f"Added {added} new IMEIs to {product.name}. ({duplicates} duplicates skipped)."
        else:
            product.accessory_stock += accessory_quantity
            product.save()
            msg = f"Updated stock for {product.name}. Current stock: {product.accessory_stock}."

        SyncEvent.objects.create(
            event_type='STOCK_UPDATE',
            payload={'product_id': product.id, 'name': product.name, 'stock': product.current_stock}
        )

        return Response({
            'success': True,
            'message': msg,
            'current_stock': product.current_stock
        })


# ==========================================
# In-Store POS APIs (Cashier)
# ==========================================

class BarcodeLookupAPIView(APIView):
    """Instantly identify product by Barcode, SKU, or 15-digit IMEI"""
    def get(self, request):
        code = request.GET.get('code', '').strip()
        if not code:
            return Response({'error': 'No barcode or code provided'}, status=status.HTTP_400_BAD_REQUEST)

        product = Product.objects.filter(barcode__iexact=code, is_active=True).first()
        if product:
            serializer = ProductListSerializer(product)
            return Response({'match_type': 'BARCODE', 'product': serializer.data})

        product = Product.objects.filter(sku__iexact=code, is_active=True).first()
        if product:
            serializer = ProductListSerializer(product)
            return Response({'match_type': 'SKU', 'product': serializer.data})

        imei_obj = ProductIMEI.objects.filter(imei__iexact=code).select_related('product').first()
        if imei_obj:
            product = imei_obj.product
            serializer = ProductListSerializer(product)
            return Response({
                'match_type': 'IMEI',
                'imei': imei_obj.imei,
                'imei_status': imei_obj.status,
                'product': serializer.data
            })

        return Response({'error': f"No product found matching code '{code}'"}, status=status.HTTP_404_NOT_FOUND)


class POSCheckoutAPIView(APIView):
    """Process in-store cashier transaction with IMEI assignment, ledger entry, and stock deduction"""
    @transaction.atomic
    def post(self, request):
        data = request.data
        cart_items = data.get('items', [])
        if not cart_items:
            return Response({'error': 'Cart is empty'}, status=status.HTTP_400_BAD_REQUEST)

        customer_name = data.get('customer_name', 'Walk-in Customer')
        customer_phone = data.get('customer_phone', '')
        payment_method = data.get('payment_method', 'CASH')
        payment_status_param = data.get('payment_status', 'PAID')
        discount_amount = Decimal(str(data.get('discount_amount', 0)))
        cash_received = Decimal(str(data.get('cash_received', 0)))
        cashier_name = data.get('cashier_name', 'Cashier 01')
        notes = data.get('notes', '')

        order_num = data.get('order_number') or f"POS-{timezone.now().strftime('%y%m%d')}-{uuid.uuid4().hex[:4].upper()}"

        subtotal = Decimal('0.00')
        total_cost = Decimal('0.00')
        processed_items = []
        assigned_imeis_summary = []

        for item in cart_items:
            product_id = item.get('product_id')
            qty = int(item.get('quantity', 1))
            unit_price = Decimal(str(item.get('unit_price', 0)))
            selected_imeis = item.get('selected_imeis', [])

            product = get_object_or_404(Product, pk=product_id)

            if product.requires_imei:
                available_imeis = list(product.imeis.filter(status='AVAILABLE'))
                if len(available_imeis) < qty:
                    return Response({
                        'error': f"Not enough stock for '{product.name}'. Requested: {qty}, Available: {len(available_imeis)}"
                    }, status=status.HTTP_400_BAD_REQUEST)

                imeis_to_assign = []
                if selected_imeis and len(selected_imeis) == qty:
                    for im in selected_imeis:
                        im_record = product.imeis.filter(imei=im, status='AVAILABLE').first()
                        if not im_record:
                            return Response({'error': f"IMEI {im} is not available for sale."}, status=status.HTTP_400_BAD_REQUEST)
                        imeis_to_assign.append(im_record)
                else:
                    imeis_to_assign = available_imeis[:qty]

                processed_items.append({
                    'product': product,
                    'product_name': product.name,
                    'quantity': qty,
                    'unit_price': unit_price,
                    'wholesale_cost': product.wholesale_price,
                    'total_price': unit_price * Decimal(qty),
                    'imei_objs': imeis_to_assign,
                    'imeis_str': [im.imei for im in imeis_to_assign]
                })
            else:
                if product.accessory_stock < qty:
                    return Response({
                        'error': f"Not enough stock for '{product.name}'. Available: {product.accessory_stock}"
                    }, status=status.HTTP_400_BAD_REQUEST)

                processed_items.append({
                    'product': product,
                    'product_name': product.name,
                    'quantity': qty,
                    'unit_price': unit_price,
                    'wholesale_cost': product.wholesale_price,
                    'total_price': unit_price * Decimal(qty),
                    'imei_objs': [],
                    'imeis_str': []
                })

            subtotal += (unit_price * Decimal(qty))
            total_cost += (product.wholesale_price * Decimal(qty))

        total_amount = max(Decimal('0.00'), subtotal - discount_amount)
        change_returned = max(Decimal('0.00'), cash_received - total_amount) if payment_method == 'CASH' and cash_received >= total_amount else Decimal('0.00')

        # Create Order
        order = Order.objects.create(
            order_number=order_num,
            channel='POS',
            customer_name=customer_name,
            customer_phone=customer_phone,
            subtotal=subtotal,
            discount_amount=discount_amount,
            delivery_fee=Decimal('0.00'),
            total_amount=total_amount,
            total_cost=total_cost,
            payment_method=payment_method,
            payment_status=payment_status_param,
            payment_reference=f"TXN-{uuid.uuid4().hex[:8].upper()}" if payment_method != 'CASH' else '',
            cash_received=cash_received if payment_method == 'CASH' else total_amount,
            change_returned=change_returned,
            fulfillment_status='COMPLETED',
            cashier_name=cashier_name,
            notes=notes
        )

        for p_item in processed_items:
            prod = p_item['product']
            OrderItem.objects.create(
                order=order,
                product=prod,
                product_name=p_item['product_name'],
                quantity=p_item['quantity'],
                unit_price=p_item['unit_price'],
                wholesale_unit_cost=p_item['wholesale_cost'],
                total_price=p_item['total_price'],
                imeis_json=p_item['imeis_str']
            )

            if prod.requires_imei:
                for im_obj in p_item['imei_objs']:
                    im_obj.status = 'SOLD_POS'
                    im_obj.sold_date = timezone.now()
                    im_obj.order = order
                    im_obj.save()
                    assigned_imeis_summary.append({'product': prod.name, 'imei': im_obj.imei})
            else:
                prod.accessory_stock = max(0, prod.accessory_stock - p_item['quantity'])
                prod.save()

        # Update Daily Ledger if paid
        if order.payment_status == 'PAID':
            today = timezone.localdate()
            ledger, _ = DailyLedger.objects.get_or_create(date=today)
            if payment_method == 'CASH':
                ledger.cash_sales += total_amount
            elif payment_method == 'ABA_PAY':
                ledger.aba_sales += total_amount
            elif payment_method == 'CREDIT_CARD':
                ledger.card_sales += total_amount

            ledger.total_revenue += total_amount
            ledger.total_cost += total_cost
            ledger.total_profit = max(Decimal('0.00'), ledger.total_revenue - ledger.total_cost)
            ledger.order_count += 1
            ledger.save()

        SyncEvent.objects.create(
            event_type='POS_SALE',
            payload={
                'order_number': order.order_number,
                'total_amount': str(order.total_amount),
                'items_count': len(processed_items)
            }
        )

        return Response({
            'success': True,
            'order_number': order.order_number,
            'total_amount': order.total_amount,
            'payment_status': order.payment_status,
            'change_returned': order.change_returned,
            'payment_method': order.payment_method,
            'assigned_imeis': assigned_imeis_summary,
            'receipt_data': OrderSerializer(order).data
        }, status=status.HTTP_201_CREATED)


class DailyLedgerSummaryAPIView(APIView):
    """Retrieve today's shift totals and payment breakdowns for cashier closing"""
    def get(self, request):
        today = timezone.localdate()
        ledger, _ = DailyLedger.objects.get_or_create(date=today)
        orders = Order.objects.filter(created_at__date=today).order_by('-created_at')
        
        return Response({
            'ledger': DailyLedgerSerializer(ledger).data,
            'expected_drawer_cash': ledger.opening_cash + ledger.cash_sales,
            'recent_orders': OrderSerializer(orders[:15], many=True).data
        })


# ==========================================
# E-Commerce APIs (Online Customer & Delivery)
# ==========================================

class EcommerceCheckoutAPIView(APIView):
    """Customer Online Checkout with Phnom Penh delivery and live alert to in-store POS"""
    @transaction.atomic
    def post(self, request):
        data = request.data
        items = data.get('items', [])
        if not items:
            return Response({'error': 'Your cart is empty'}, status=status.HTTP_400_BAD_REQUEST)

        customer_name = data.get('customer_name', '').strip()
        customer_phone = data.get('customer_phone', '').strip()
        customer_email = data.get('customer_email', '').strip()
        delivery_city = data.get('delivery_city', 'Phnom Penh')
        delivery_district = data.get('delivery_district', '').strip()
        delivery_address = data.get('delivery_address', '').strip()
        payment_method = data.get('payment_method', 'ABA_PAY')
        notes = data.get('notes', '')

        if not customer_name or not customer_phone or not delivery_address:
            return Response({'error': 'Name, phone number, and delivery address are required.'}, status=status.HTTP_400_BAD_REQUEST)

        subtotal = Decimal('0.00')
        total_cost = Decimal('0.00')
        processed_items = []

        for it in items:
            prod = get_object_or_404(Product, pk=it['product_id'])
            qty = int(it.get('quantity', 1))

            if prod.current_stock < qty:
                return Response({'error': f"'{prod.name}' is currently out of stock or low in stock."}, status=status.HTTP_400_BAD_REQUEST)

            unit_price = prod.effective_price
            item_total = unit_price * Decimal(qty)
            subtotal += item_total
            total_cost += (prod.wholesale_price * Decimal(qty))

            processed_items.append({
                'product': prod,
                'product_name': prod.name,
                'quantity': qty,
                'unit_price': unit_price,
                'wholesale_cost': prod.wholesale_price,
                'total_price': item_total
            })

        delivery_fee = Decimal('0.00') if subtotal >= Decimal('500.00') else Decimal('1.50')
        total_amount = subtotal + delivery_fee

        order_num = f"BC-{timezone.now().strftime('%y%m%d')}-{uuid.uuid4().hex[:4].upper()}"

        order = Order.objects.create(
            order_number=order_num,
            channel='ONLINE',
            customer_name=customer_name,
            customer_phone=customer_phone,
            customer_email=customer_email,
            delivery_city=delivery_city,
            delivery_district=delivery_district,
            delivery_address=delivery_address,
            subtotal=subtotal,
            discount_amount=Decimal('0.00'),
            delivery_fee=delivery_fee,
            total_amount=total_amount,
            total_cost=total_cost,
            payment_method=payment_method,
            payment_status='PENDING' if payment_method == 'ABA_PAY' else 'PAID' if payment_method == 'COD' else 'PENDING',
            payment_reference=f"ABA-{uuid.uuid4().hex[:8].upper()}" if payment_method == 'ABA_PAY' else '',
            fulfillment_status='PENDING',
            cashier_name='Online Store',
            notes=notes
        )

        for p_item in processed_items:
            prod = p_item['product']
            OrderItem.objects.create(
                order=order,
                product=prod,
                product_name=p_item['product_name'],
                quantity=p_item['quantity'],
                unit_price=p_item['unit_price'],
                wholesale_unit_cost=p_item['wholesale_cost'],
                total_price=p_item['total_price'],
                imeis_json=[]
            )

        # Update Daily Ledger
        today = timezone.localdate()
        ledger, _ = DailyLedger.objects.get_or_create(date=today)
        ledger.online_sales += total_amount
        ledger.total_revenue += total_amount
        ledger.total_cost += total_cost
        ledger.total_profit = max(Decimal('0.00'), ledger.total_revenue - ledger.total_cost)
        ledger.order_count += 1
        ledger.save()

        SyncEvent.objects.create(
            event_type='NEW_ONLINE_ORDER',
            payload={
                'order_id': order.id,
                'order_number': order.order_number,
                'customer_name': order.customer_name,
                'customer_phone': order.customer_phone,
                'delivery_district': order.delivery_district,
                'total_amount': str(order.total_amount),
                'items_summary': f"{len(processed_items)} item(s)",
                'time': timezone.localtime(order.created_at).strftime('%H:%M:%S')
            }
        )

        return Response({
            'success': True,
            'order_number': order.order_number,
            'total_amount': order.total_amount,
            'delivery_fee': order.delivery_fee,
            'payment_status': order.payment_status,
            'fulfillment_status': order.fulfillment_status,
            'message': 'Order placed successfully! In-store staff has received the order for packing.'
        }, status=status.HTTP_201_CREATED)


class OrderFulfillmentAPIView(APIView):
    """In-store staff updates fulfillment status and assigns serial IMEIs before delivery dispatch"""
    @transaction.atomic
    def post(self, request, order_id):
        order = get_object_or_404(Order, pk=order_id)
        new_status = request.data.get('status')
        assigned_imeis = request.data.get('assigned_imeis', {})

        if new_status:
            order.fulfillment_status = new_status
            if new_status == 'COMPLETED':
                order.payment_status = 'PAID'

        if assigned_imeis:
            for item in order.items.all():
                prod = item.product
                p_id_str = str(prod.id)
                if p_id_str in assigned_imeis:
                    imei_list = assigned_imeis[p_id_str]
                    item.imeis_json = imei_list
                    item.save()

                    for im in imei_list:
                        im_obj = ProductIMEI.objects.filter(product=prod, imei=im, status='AVAILABLE').first()
                        if im_obj:
                            im_obj.status = 'RESERVED_ONLINE' if new_status != 'COMPLETED' else 'SOLD_POS'
                            im_obj.sold_date = timezone.now()
                            im_obj.order = order
                            im_obj.save()

        order.save()

        SyncEvent.objects.create(
            event_type='ORDER_STATUS_CHANGE',
            payload={'order_number': order.order_number, 'status': order.fulfillment_status}
        )

        return Response({
            'success': True,
            'order_number': order.order_number,
            'fulfillment_status': order.fulfillment_status
        })


class OrderTrackingStatusAPIView(APIView):
    """Customer lookup for live order progress"""
    def get(self, request, order_number):
        order = get_object_or_404(Order, order_number=order_number)
        return Response(OrderSerializer(order).data)


class OnlineOrdersListAPIView(APIView):
    """List online orders needing in-store packing & fulfillment"""
    def get(self, request):
        status_filter = request.GET.get('status')
        queryset = Order.objects.filter(channel='ONLINE').order_by('-created_at')
        if status_filter:
            queryset = queryset.filter(fulfillment_status=status_filter)
        return Response(OrderSerializer(queryset[:30], many=True).data)


# ==========================================
# Real-Time Event Sync API
# ==========================================

class RealtimeSyncEventsAPIView(APIView):
    """Returns recent events since a timestamp/last_id for sub-second live syncing"""
    def get(self, request):
        last_id = int(request.GET.get('since_id', 0))
        events = SyncEvent.objects.filter(id__gt=last_id).order_by('id')[:25]
        return Response(SyncEventSerializer(events, many=True).data)
