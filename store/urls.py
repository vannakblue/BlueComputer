from django.urls import path
from . import views

urlpatterns = [
    # HTML Web Pages
    path('', views.ecommerce_view, name='store_home'),
    path('pos/', views.pos_view, name='pos_screen'),
    path('admin-portal/', views.admin_portal_view, name='admin_portal'),
    path('track/<str:order_number>/', views.order_tracking_view, name='order_tracking'),
    path('track/', views.order_tracking_view, name='order_tracking_blank'),
    path('pay/khqr/<str:order_number>/', views.khqr_mobile_pay_view, name='khqr_mobile_pay'),

    # Bakong / ABA KHQR Scan & Pay APIs
    path('api/payment/khqr/generate/', views.GenerateKHQRAPIView.as_view(), name='api_khqr_generate'),
    path('api/payment/khqr/approve/<str:order_number>/', views.ApproveKHQRPaymentAPIView.as_view(), name='api_khqr_approve'),
    path('api/payment/khqr/status/<str:order_number>/', views.CheckKHQRStatusAPIView.as_view(), name='api_khqr_status'),

    # REST Catalog APIs
    path('api/products/', views.ProductCatalogAPIView.as_view(), name='api_products_list'),
    path('api/products/<str:pk_or_slug>/', views.ProductDetailAPIView.as_view(), name='api_product_detail'),
    path('api/categories/', views.CategoryListAPIView.as_view(), name='api_categories'),
    path('api/brands/', views.BrandListAPIView.as_view(), name='api_brands'),

    # REST Admin / Manager APIs
    path('api/admin/dashboard-stats/', views.InventoryDashboardStatsAPIView.as_view(), name='api_admin_stats'),
    path('api/admin/products/manage/', views.ProductManagementAPIView.as_view(), name='api_admin_product_create'),
    path('api/admin/products/<int:product_id>/receive-stock/', views.BatchIMEIReceiveAPIView.as_view(), name='api_admin_receive_stock'),

    # REST POS Cashier APIs
    path('api/pos/lookup/', views.BarcodeLookupAPIView.as_view(), name='api_pos_lookup'),
    path('api/pos/checkout/', views.POSCheckoutAPIView.as_view(), name='api_pos_checkout'),
    path('api/pos/ledger-summary/', views.DailyLedgerSummaryAPIView.as_view(), name='api_pos_ledger'),

    # REST E-Commerce APIs
    path('api/ecommerce/checkout/', views.EcommerceCheckoutAPIView.as_view(), name='api_ecommerce_checkout'),
    path('api/ecommerce/orders/online/', views.OnlineOrdersListAPIView.as_view(), name='api_online_orders_list'),
    path('api/ecommerce/orders/<int:order_id>/fulfill/', views.OrderFulfillmentAPIView.as_view(), name='api_order_fulfill'),
    path('api/ecommerce/track/<str:order_number>/', views.OrderTrackingStatusAPIView.as_view(), name='api_order_track'),

    # Real-Time Event Sync API
    path('api/sync/events/', views.RealtimeSyncEventsAPIView.as_view(), name='api_sync_events'),
]
