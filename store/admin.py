from django.contrib import admin
from .models import Category, Brand, Product, ProductIMEI, Order, OrderItem, DailyLedger, SyncEvent

class ProductIMEIInline(admin.TabularInline):
    model = ProductIMEI
    extra = 1
    fields = ('imei', 'serial_number', 'status', 'sold_date', 'order')
    readonly_fields = ('sold_date',)

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'brand', 'category', 'sku', 'barcode', 'wholesale_price', 'retail_price', 'current_stock', 'requires_imei', 'is_featured', 'is_active')
    list_filter = ('brand', 'category', 'requires_imei', 'is_featured', 'is_active')
    search_fields = ('name', 'sku', 'barcode')
    prepopulated_fields = {'slug': ('name',)}
    inlines = [ProductIMEIInline]

@admin.register(ProductIMEI)
class ProductIMEIAdmin(admin.ModelAdmin):
    list_display = ('imei', 'product', 'status', 'received_date', 'sold_date', 'order')
    list_filter = ('status', 'received_date')
    search_fields = ('imei', 'serial_number', 'product__name')

class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ('product', 'product_name', 'quantity', 'unit_price', 'wholesale_unit_cost', 'total_price', 'imeis_json')

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('order_number', 'channel', 'customer_name', 'total_amount', 'payment_method', 'payment_status', 'fulfillment_status', 'created_at')
    list_filter = ('channel', 'payment_method', 'payment_status', 'fulfillment_status')
    search_fields = ('order_number', 'customer_name', 'customer_phone')
    inlines = [OrderItemInline]

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'icon')
    prepopulated_fields = {'slug': ('name',)}

@admin.register(Brand)
class BrandAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug')
    prepopulated_fields = {'slug': ('name',)}

@admin.register(DailyLedger)
class DailyLedgerAdmin(admin.ModelAdmin):
    list_display = ('date', 'opening_cash', 'cash_sales', 'aba_sales', 'card_sales', 'online_sales', 'total_revenue', 'total_profit', 'order_count')

@admin.register(SyncEvent)
class SyncEventAdmin(admin.ModelAdmin):
    list_display = ('event_type', 'created_at')
