// Blue Computer Internationalization (i18n) Engine - Khmer 🇰🇭 & English 🇬🇧
const translations = {
    en: {
        // Nav & Global
        "nav_ecommerce": "E-Commerce Store",
        "nav_pos": "In-Store POS",
        "nav_inventory": "Inventory & Ledger",
        "nav_tracking": "Order Tracking",
        "nav_live_synced": "Live Synced",
        "nav_cart": "Cart",
        "phnom_penh_store": "Phnom Penh Retail & Online Store",
        
        // E-Commerce Storefront
        "hero_badge": "100% Genuine Apple & Samsung • Official Cambodia Warranty",
        "hero_title_1": "Upgrade to Next-Gen",
        "hero_title_2": "Power & Elegance",
        "hero_desc": "Explore iPhone 15 Pro Titanium, Galaxy S24 Ultra AI, and authentic fast-charging accessories. Fast 1-hour delivery across Phnom Penh.",
        "hero_shop_now": "Shop Catalog",
        "hero_switch_pos": "Switch to Cashier POS",
        "hot_deal": "Hot Deal",
        "in_stock": "In Stock",
        "out_of_stock": "Out of Stock",
        "units_in_stock": "Units in Stock",
        
        // Filters & Search
        "search_catalog_placeholder": "Search by phone name, SKU, Apple, Samsung...",
        "sort_by": "Sort by:",
        "sort_newest": "Newest First",
        "sort_price_low": "Price: Low to High",
        "sort_price_high": "Price: High to Low",
        "sort_name": "Name A-Z",
        "all_brands": "All Brands",
        "all_categories": "All Categories",
        "cat_smartphones": "Smartphones",
        "cat_tablets": "Tablets & iPads",
        "cat_chargers": "Chargers & Power",
        "cat_cases": "Cases & Glass",
        "catalog_title": "Available In-Store & Online",
        "stock_synced_live": "Stock synced live with retail POS",
        "add_to_cart": "Add to Cart",
        "sold_out": "Sold Out",
        "quick_view": "Quick View",
        
        // Cart & Checkout
        "your_cart": "Your Cart",
        "empty_cart": "Your shopping bag is empty.",
        "subtotal": "Subtotal:",
        "delivery_fee": "Phnom Penh Delivery:",
        "total_amount": "Total Amount:",
        "proceed_checkout": "Proceed to Checkout",
        "complete_order": "Complete Your Order",
        "checkout_desc": "In-store staff will pack and prepare your device immediately.",
        "recipient_name": "Recipient Full Name *",
        "phone_number": "Phone Number * (Telegram)",
        "city_province": "City / Province *",
        "district_khan": "Khan / District in Phnom Penh *",
        "street_address": "Street, House No., Building / Landmark *",
        "payment_method": "Choose Payment Method:",
        "aba_pay_khqr": "ABA Pay (KHQR)",
        "cash_on_delivery": "Cash on Delivery",
        "credit_card": "Credit Card",
        "confirm_and_pay": "Confirm & Pay",
        
        // POS Cashier Screen
        "pos_station_title": "In-Store POS Station #01",
        "pos_cashier": "Cashier:",
        "shift_ledger_btn": "Daily Shift Ledger",
        "online_orders_btn": "Online Orders",
        "scan_barcode_placeholder": "Scan barcode / IMEI or search product...",
        "scan_enter_btn": "Scan / Enter",
        "simulate_scan_label": "Simulate Scan:",
        "virtual_cart": "POS Virtual Cart",
        "clear_cart": "Clear",
        "quick_upsells": "Quick Upsell Add-ons:",
        "discount_label": "Discount:",
        "total_payable": "Total Payable",
        "in_riel": "In Riel (KHR ~4,100)",
        "process_payment_btn": "Process Payment ($)",
        "assign_imei_btn": "Assign Serial IMEI",
        "amount_tendered": "Amount Tendered / Received ($):",
        "change_to_return": "Change to Return:",
        "complete_sale_print": "Complete Sale & Print Receipt",
        "awaiting_scan": "Awaiting Scan",
        "expires_in": "Expires:",
        
        // Admin Inventory
        "kpi_total_units": "Total Inventory Units",
        "kpi_wholesale_val": "Wholesale Cost Value",
        "kpi_retail_val": "Retail Market Value",
        "kpi_today_sales": "Today's Sales Revenue",
        "receive_stock_btn": "Receive Stock / Add Phone",
        "inventory_tracker_title": "Central Product Inventory & IMEI Tracker",
        "col_product": "Product / Model",
        "col_brand_cat": "Brand & Category",
        "col_sku_barcode": "SKU / Barcode",
        "col_wholesale": "Wholesale Cost",
        "col_retail": "Retail Price",
        "col_margin": "Margin %",
        "col_stock": "Stock Status",
        "col_actions": "Actions",
        "view_imeis": "View IMEIs",
        
        // Order Tracking
        "track_title": "Live Order Tracking",
        "track_desc": "Track your smartphone delivery status from our Phnom Penh store in real time.",
        "track_placeholder": "Enter Order Number (e.g. BC-260827-XXXX)",
        "track_btn": "Track",
        "step_placed": "Order Placed",
        "step_packing": "Store Packing",
        "step_rider": "Express Rider",
        "step_delivered": "Delivered",
        "support_help": "Need assistance with your delivery?",
    },
    km: {
        // Nav & Global
        "nav_ecommerce": "ហាងលក់អនឡាញ",
        "nav_pos": "ផ្ទាំងគិតលុយ POS",
        "nav_inventory": "ស្តុក & បញ្ជីចំណូល",
        "nav_tracking": "តាមដានការកុម្ម៉ង់",
        "nav_live_synced": "ភ្ជាប់ផ្ទាល់ Live",
        "nav_cart": "កន្ត្រកទំនិញ",
        "phnom_penh_store": "ហាងលក់ទូរស័ព្ទ & សេវាកម្មភ្នំពេញ",
        
        // E-Commerce Storefront
        "hero_badge": "ទូរស័ព្ទសុទ្ធ ១០០% Apple & Samsung • ធានាផ្លូវការនៅកម្ពុជា",
        "hero_title_1": "ប្តូរទៅកាន់ស្មាតហ្វូន",
        "hero_title_2": "ជំនាន់ថ្មី & ទំនើប",
        "hero_desc": "ស្វែងរក iPhone 15 Pro Titanium, Galaxy S24 Ultra AI និងគ្រឿងបន្លាស់សាកថ្មល្បឿនលឿនសុទ្ធ។ ដឹកជញ្ជូនរហ័ស ១ ម៉ោងទូទាំងរាជធានីភ្នំពេញ។",
        "hero_shop_now": "ទិញទំនិញឥឡូវនេះ",
        "hero_switch_pos": "ប្តូរទៅផ្ទាំងគិតលុយ POS",
        "hot_deal": "តម្លៃពិសេស",
        "in_stock": "មានក្នុងស្តុក",
        "out_of_stock": "អស់ពីស្តុក",
        "units_in_stock": "គ្រឿងក្នុងស្តុក",
        
        // Filters & Search
        "search_catalog_placeholder": "ស្វែងរកតាមឈ្មោះទូរស័ព្ទ, SKU, Apple, Samsung...",
        "sort_by": "តម្រៀបតាម:",
        "sort_newest": "មកដល់ថ្មីៗ",
        "sort_price_low": "តម្លៃ: ពីទាបទៅខ្ពស់",
        "sort_price_high": "តម្លៃ: ពីខ្ពស់ទៅទាប",
        "sort_name": "ឈ្មោះ A-Z",
        "all_brands": "ម៉ាកទាំងអស់",
        "all_categories": "ប្រភេទទាំងអស់",
        "cat_smartphones": "ទូរស័ព្ទដៃ",
        "cat_tablets": "ថេប្លេត & iPad",
        "cat_chargers": "ឆ្នាំងសាក & Power",
        "cat_cases": "ស្រោម & កញ្ចក់ការពារ",
        "catalog_title": "ទំនិញដែលមានក្នុងហាង & អនឡាញ",
        "stock_synced_live": "ស្តុកត្រូវបានភ្ជាប់ Real-time ជាមួយ POS",
        "add_to_cart": "ដាក់ក្នុងកន្ត្រក",
        "sold_out": "អស់ពីស្តុក",
        "quick_view": "មើលលម្អិត",
        
        // Cart & Checkout
        "your_cart": "កន្ត្រកទំនិញរបស់អ្នក",
        "empty_cart": "មិនទាន់មានទំនិញក្នុងកន្ត្រកនៅឡើយទេ។",
        "subtotal": "សរុបបណ្តោះអាសន្ន:",
        "delivery_fee": "ថ្លៃដឹកជញ្ជូនភ្នំពេញ:",
        "total_amount": "ទឹកប្រាក់សរុប:",
        "proceed_checkout": "បន្តទៅការទូទាត់",
        "complete_order": "បំពេញព័ត៌មានកុម្ម៉ង់ទិញ",
        "checkout_desc": "បុគ្គលិកក្នុងហាងនឹងរៀបចំ និងវេចខ្ចប់ទូរស័ព្ទជូនលោកអ្នកភ្លាមៗ។",
        "recipient_name": "ឈ្មោះអ្នកទទួល *",
        "phone_number": "លេខទូរស័ព្ទ * (Telegram)",
        "city_province": "រាជធានី / ខេត្ត *",
        "district_khan": "ខណ្ឌ / ស្រុក ក្នុងរាជធានីភ្នំពេញ *",
        "street_address": "លេខផ្ទះ, ផ្លូវ, អគារ / ទីតាំងចំណាំ *",
        "payment_method": "ជ្រើសរើសវិធីទូទាត់ប្រាក់:",
        "aba_pay_khqr": "ស្កេន ABA Pay (KHQR)",
        "cash_on_delivery": "ទូទាត់ពេលទំនិញទៅដល់ (COD)",
        "credit_card": "កាតធនាគារ (Credit Card)",
        "confirm_and_pay": "បញ្ជាក់ការកុម្ម៉ង់ & ទូទាត់",
        
        // POS Cashier Screen
        "pos_station_title": "ផ្ទាំងគិតលុយក្នុងហាង POS ទីតាំង #01",
        "pos_cashier": "អ្នកគិតលុយ:",
        "shift_ledger_btn": "សៀវភៅចំណូលវេនលក់",
        "online_orders_btn": "ការកុម្ម៉ង់អនឡាញ",
        "scan_barcode_placeholder": "ស្កេនបាកូដ / IMEI ឬវាយឈ្មោះទំនិញ...",
        "scan_enter_btn": "ស្កេន / ស្វែងរក",
        "simulate_scan_label": "តេស្តស្កេនបាកូដ:",
        "virtual_cart": "កន្ត្រកលក់ POS",
        "clear_cart": "សម្អាតកន្ត្រក",
        "quick_upsells": "ទំនិញបន្ថែមរហ័ស (Upsells):",
        "discount_label": "បញ្ចុះតម្លៃ:",
        "total_payable": "ទឹកប្រាក់ត្រូវបង់សរុប",
        "in_riel": "គិតជាប្រាក់រៀល (~4,100)",
        "process_payment_btn": "ដំណើរការទូទាត់ ($)",
        "assign_imei_btn": "កំណត់លេខ Serial IMEI",
        "amount_tendered": "ប្រាក់ទទួលពីអតិថិជន ($):",
        "change_to_return": "ប្រាក់ត្រូវអាប់ជូនវិញ:",
        "complete_sale_print": "បញ្ចប់ការលក់ & បោះពុម្ពវិក្កយបត្រ",
        "awaiting_scan": "រង់ចាំការស្កេន",
        "expires_in": "ផុតកំណត់:",
        
        // Admin Inventory
        "kpi_total_units": "ចំនួនស្តុកសរុប",
        "kpi_wholesale_val": "ដើមទុនស្តុក (Wholesale)",
        "kpi_retail_val": "តម្លៃលក់សរុប (Retail)",
        "kpi_today_sales": "ចំណូលលក់ថ្ងៃនេះ",
        "receive_stock_btn": "ទទួលស្តុកចូល / បន្ថែមទូរស័ព្ទ",
        "inventory_tracker_title": "តារាងគ្រប់គ្រងស្តុក & តាមដានលេខ IMEI ផ្ទាល់",
        "col_product": "ម៉ូឌែលទូរស័ព្ទ / ផលិតផល",
        "col_brand_cat": "ម៉ាក & ប្រភេទ",
        "col_sku_barcode": "SKU / បាកូដ",
        "col_wholesale": "ថ្លៃដើម ($)",
        "col_retail": "តម្លៃលក់ ($)",
        "col_margin": "ភាគរយចំណេញ",
        "col_stock": "ស្ថានភាពស្តុក",
        "col_actions": "សកម្មភាព",
        "view_imeis": "មើលលេខ IMEI",
        
        // Order Tracking
        "track_title": "តាមដានការបញ្ជាទិញផ្ទាល់",
        "track_desc": "តាមដានស្ថានភាពដឹកជញ្ជូនទូរស័ព្ទពីរហាងភ្នំពេញក្នុងពេលជាក់ស្តែង។",
        "track_placeholder": "បញ្ចូលលេខកូដកុម្ម៉ង់ (ឧ. BC-260827-XXXX)",
        "track_btn": "ស្វែងរក",
        "step_placed": "បានកុម្ម៉ង់",
        "step_packing": "កំពុងវេចខ្ចប់",
        "step_rider": "អ្នកដឹកជញ្ជូន",
        "step_delivered": "បានប្រគល់ជូន",
        "support_help": "ត្រូវការជំនួយលើការដឹកជញ្ជូន?",
    }
};

let currentLang = localStorage.getItem('bc_language') || 'km'; // Default to Khmer

function getTranslation(key) {
    if (translations[currentLang] && translations[currentLang][key]) {
        return translations[currentLang][key];
    }
    if (translations['en'] && translations['en'][key]) {
        return translations['en'][key];
    }
    return key;
}

function setLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('bc_language', lang);
    applyTranslations();
    updateLanguageSwitcherUI();
    window.dispatchEvent(new CustomEvent('language_changed', { detail: { lang } }));
}

function applyTranslations() {
    // Translate text content
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (key) {
            el.innerHTML = getTranslation(key);
        }
    });

    // Translate input placeholders
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (key) {
            el.placeholder = getTranslation(key);
        }
    });

    // Set font family preference
    if (currentLang === 'km') {
        document.body.style.fontFamily = "'Kantumruy Pro', 'Plus Jakarta Sans', sans-serif";
    } else {
        document.body.style.fontFamily = "'Plus Jakarta Sans', sans-serif";
    }
}

function updateLanguageSwitcherUI() {
    const btnKm = document.getElementById('lang-btn-km');
    const btnEn = document.getElementById('lang-btn-en');
    
    if (btnKm && btnEn) {
        if (currentLang === 'km') {
            btnKm.className = "px-2.5 py-1 rounded-lg text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 flex items-center gap-1.5 shadow-sm";
            btnEn.className = "px-2.5 py-1 rounded-lg text-xs font-medium text-slate-400 hover:text-white flex items-center gap-1.5";
        } else {
            btnEn.className = "px-2.5 py-1 rounded-lg text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 flex items-center gap-1.5 shadow-sm";
            btnKm.className = "px-2.5 py-1 rounded-lg text-xs font-medium text-slate-400 hover:text-white flex items-center gap-1.5";
        }
    }
}

// Auto-apply on page load
document.addEventListener('DOMContentLoaded', () => {
    applyTranslations();
    updateLanguageSwitcherUI();
});

window.i18n = {
    get: getTranslation,
    set: setLanguage,
    current: () => currentLang
};
