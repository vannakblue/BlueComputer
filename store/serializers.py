from rest_framework import serializers
from .models import Category, Brand, Product, ProductIMEI, Order, OrderItem, DailyLedger, SyncEvent

class CategorySerializer(serializers.ModelSerializer):
    product_count = serializers.IntegerField(source='products.count', read_only=True)
    
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'icon', 'description', 'product_count']


class BrandSerializer(serializers.ModelSerializer):
    product_count = serializers.IntegerField(source='products.count', read_only=True)
    
    class Meta:
        model = Brand
        fields = ['id', 'name', 'slug', 'logo_url', 'product_count']


class ProductIMEISerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductIMEI
        fields = ['id', 'imei', 'serial_number', 'status', 'received_date', 'sold_date', 'order']


class ProductListSerializer(serializers.ModelSerializer):
    brand_name = serializers.CharField(source='brand.name', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    current_stock = serializers.IntegerField(read_only=True)
    effective_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    margin_percentage = serializers.DecimalField(max_digits=5, decimal_places=1, read_only=True)
    available_imeis = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'slug', 'brand', 'brand_name', 'category', 'category_name',
            'barcode', 'sku', 'description', 'specs', 'color', 'storage',
            'wholesale_price', 'retail_price', 'discount_price', 'effective_price',
            'margin_percentage', 'image_url', 'requires_imei', 'current_stock',
            'is_featured', 'is_active', 'available_imeis', 'created_at'
        ]

    def get_available_imeis(self, obj):
        if obj.requires_imei:
            return list(obj.imeis.filter(status='AVAILABLE').values_list('imei', flat=True)[:20])
        return []


class ProductDetailSerializer(serializers.ModelSerializer):
    brand_name = serializers.CharField(source='brand.name', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    current_stock = serializers.IntegerField(read_only=True)
    effective_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    margin_percentage = serializers.DecimalField(max_digits=5, decimal_places=1, read_only=True)
    profit_per_unit = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    imeis = ProductIMEISerializer(many=True, read_only=True)

    class Meta:
        model = Product
        fields = '__all__'


class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = ['id', 'product', 'product_name', 'quantity', 'unit_price', 'wholesale_unit_cost', 'total_price', 'imeis_json']


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    total_profit = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = Order
        fields = [
            'id', 'order_number', 'channel', 'customer_name', 'customer_phone', 'customer_email',
            'delivery_city', 'delivery_district', 'delivery_address',
            'subtotal', 'discount_amount', 'delivery_fee', 'total_amount', 'total_cost', 'total_profit',
            'payment_method', 'payment_status', 'payment_reference', 'cash_received', 'change_returned',
            'fulfillment_status', 'cashier_name', 'notes', 'created_at', 'updated_at', 'items'
        ]


class DailyLedgerSerializer(serializers.ModelSerializer):
    class Meta:
        model = DailyLedger
        fields = '__all__'


class SyncEventSerializer(serializers.ModelSerializer):
    class Meta:
        model = SyncEvent
        fields = '__all__'
