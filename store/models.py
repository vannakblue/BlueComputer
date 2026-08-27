from django.db import models
from django.utils import timezone
from decimal import Decimal
import uuid

class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=100, unique=True)
    icon = models.CharField(max_length=50, default='smartphone')
    description = models.TextField(blank=True)

    class Meta:
        verbose_name_plural = 'Categories'
        ordering = ['name']

    def __str__(self):
        return self.name


class Brand(models.Model):
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=100, unique=True)
    logo_url = models.URLField(blank=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name


class Product(models.Model):
    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, unique=True)
    brand = models.ForeignKey(Brand, on_delete=models.CASCADE, related_name='products')
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='products')
    barcode = models.CharField(max_length=50, unique=True, db_index=True)
    sku = models.CharField(max_length=50, unique=True, db_index=True)
    
    description = models.TextField(blank=True)
    specs = models.JSONField(default=dict, blank=True)
    
    color = models.CharField(max_length=50, blank=True)
    storage = models.CharField(max_length=50, blank=True)
    
    wholesale_price = models.DecimalField(max_digits=10, decimal_places=2, help_text="Cost price per unit")
    retail_price = models.DecimalField(max_digits=10, decimal_places=2, help_text="Standard selling price")
    discount_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, help_text="Promotional price if active")
    
    image_url = models.TextField(blank=True)
    requires_imei = models.BooleanField(default=True, help_text="Serialized mobile device tracking")
    accessory_stock = models.IntegerField(default=0, help_text="Stock count for non-serialized accessories")
    
    is_featured = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} ({self.sku})"

    @property
    def current_stock(self):
        if self.requires_imei:
            return self.imeis.filter(status='AVAILABLE').count()
        return self.accessory_stock

    @property
    def effective_price(self):
        if self.discount_price and self.discount_price > 0:
            return self.discount_price
        return self.retail_price

    @property
    def margin_percentage(self):
        if self.retail_price > 0:
            margin = ((self.retail_price - self.wholesale_price) / self.retail_price) * Decimal('100.0')
            return round(margin, 1)
        return Decimal('0.0')

    @property
    def profit_per_unit(self):
        return round(self.effective_price - self.wholesale_price, 2)


class ProductIMEI(models.Model):
    STATUS_CHOICES = [
        ('AVAILABLE', 'Available in Stock'),
        ('SOLD_POS', 'Sold via POS'),
        ('RESERVED_ONLINE', 'Reserved / Sold Online'),
        ('DEFECTIVE', 'Defective / RMA'),
    ]

    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='imeis')
    imei = models.CharField(max_length=30, unique=True, db_index=True)
    serial_number = models.CharField(max_length=50, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='AVAILABLE', db_index=True)
    received_date = models.DateTimeField(auto_now_add=True)
    sold_date = models.DateTimeField(null=True, blank=True)
    order = models.ForeignKey('Order', on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_imeis')

    class Meta:
        ordering = ['-received_date']

    def __str__(self):
        return f"{self.product.name} - IMEI: {self.imei} ({self.status})"


class Order(models.Model):
    CHANNEL_CHOICES = [
        ('POS', 'In-Store POS'),
        ('ONLINE', 'E-Commerce Online'),
    ]
    PAYMENT_CHOICES = [
        ('CASH', 'Cash'),
        ('ABA_PAY', 'ABA Pay / KHQR'),
        ('CREDIT_CARD', 'Credit / Debit Card'),
        ('COD', 'Cash On Delivery'),
    ]
    PAYMENT_STATUS_CHOICES = [
        ('PAID', 'Paid'),
        ('PENDING', 'Pending Payment'),
        ('FAILED', 'Failed'),
    ]
    FULFILLMENT_CHOICES = [
        ('COMPLETED', 'Completed'),
        ('PENDING', 'Pending Staff Review'),
        ('PACKING', 'Packing at Store'),
        ('OUT_FOR_DELIVERY', 'Out for Delivery'),
        ('CANCELLED', 'Cancelled'),
    ]

    order_number = models.CharField(max_length=32, unique=True, db_index=True)
    channel = models.CharField(max_length=10, choices=CHANNEL_CHOICES, default='POS')
    
    # Customer Details
    customer_name = models.CharField(max_length=120, default='Walk-in Customer')
    customer_phone = models.CharField(max_length=40, blank=True)
    customer_email = models.EmailField(blank=True, null=True)
    
    # Delivery Details (for E-commerce)
    delivery_city = models.CharField(max_length=100, default='Phnom Penh')
    delivery_district = models.CharField(max_length=100, blank=True)
    delivery_address = models.TextField(blank=True)
    
    # Financials
    subtotal = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    delivery_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    # Payment info
    payment_method = models.CharField(max_length=20, choices=PAYMENT_CHOICES, default='CASH')
    payment_status = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, default='PAID')
    payment_reference = models.CharField(max_length=100, blank=True)
    cash_received = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    change_returned = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    # Status
    fulfillment_status = models.CharField(max_length=20, choices=FULFILLMENT_CHOICES, default='COMPLETED')
    cashier_name = models.CharField(max_length=100, default='Cashier 01')
    notes = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.order_number} ({self.channel}) - ${self.total_amount}"

    @property
    def total_profit(self):
        return max(Decimal('0.00'), self.total_amount - self.delivery_fee - self.total_cost)


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.PROTECT, related_name='order_items')
    product_name = models.CharField(max_length=255)
    quantity = models.PositiveIntegerField(default=1)
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    wholesale_unit_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_price = models.DecimalField(max_digits=10, decimal_places=2)
    imeis_json = models.JSONField(default=list, blank=True)

    def __str__(self):
        return f"{self.quantity}x {self.product_name} in {self.order.order_number}"


class DailyLedger(models.Model):
    date = models.DateField(unique=True, db_index=True)
    opening_cash = models.DecimalField(max_digits=10, decimal_places=2, default=100.00)
    cash_sales = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    aba_sales = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    card_sales = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    online_sales = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    
    total_revenue = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_cost = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_profit = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    order_count = models.IntegerField(default=0)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-date']

    def __str__(self):
        return f"Daily Ledger: {self.date} - Rev: ${self.total_revenue} | Profit: ${self.total_profit}"


class SyncEvent(models.Model):
    event_type = models.CharField(max_length=50, db_index=True)
    payload = models.JSONField(default=dict)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.event_type} at {self.created_at.strftime('%H:%M:%S')}"
