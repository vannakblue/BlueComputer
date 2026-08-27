from django.core.management.base import BaseCommand
from django.utils import timezone
from decimal import Decimal
import random
from store.models import Category, Brand, Product, ProductIMEI, Order, OrderItem, DailyLedger, SyncEvent

class Command(BaseCommand):
    help = 'Seeds complete realistic demo inventory and IMEIs for Blue Computer Omnichannel System'

    def handle(self, *args, **options):
        self.stdout.write("Seeding comprehensive Blue Computer database with rich stock & serialized IMEIs...")

        # 1. Categories
        categories_data = [
            {'name': 'Smartphones', 'slug': 'smartphones', 'icon': 'smartphone', 'description': 'Flagship & budget mobile phones'},
            {'name': 'Tablets', 'slug': 'tablets', 'icon': 'tablet', 'description': 'iPads and Android tablets'},
            {'name': 'Wearables', 'slug': 'wearables', 'icon': 'watch', 'description': 'Smartwatches & fitness trackers'},
            {'name': 'Audio & Chargers', 'slug': 'audio-power', 'icon': 'battery-charging', 'description': 'Fast chargers, power banks, and earbuds'},
            {'name': 'Cases & Protection', 'slug': 'cases-protection', 'icon': 'shield', 'description': 'Premium protective cases and tempered glasses'},
        ]
        cat_map = {}
        for c in categories_data:
            cat, _ = Category.objects.get_or_create(slug=c['slug'], defaults=c)
            cat_map[c['slug']] = cat

        # 2. Brands
        brands_data = [
            {'name': 'Apple', 'slug': 'apple', 'logo_url': 'https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg'},
            {'name': 'Samsung', 'slug': 'samsung', 'logo_url': 'https://upload.wikimedia.org/wikipedia/commons/2/24/Samsung_Logo.svg'},
            {'name': 'Xiaomi', 'slug': 'xiaomi', 'logo_url': 'https://upload.wikimedia.org/wikipedia/commons/2/29/Xiaomi_logo.svg'},
            {'name': 'Anker', 'slug': 'anker', 'logo_url': ''},
            {'name': 'Spigen', 'slug': 'spigen', 'logo_url': ''},
            {'name': 'Belkin', 'slug': 'belkin', 'logo_url': ''},
            {'name': 'Baseus', 'slug': 'baseus', 'logo_url': ''},
        ]
        brand_map = {}
        for b in brands_data:
            brand, _ = Brand.objects.get_or_create(slug=b['slug'], defaults=b)
            brand_map[b['slug']] = brand

        # Helper to generate unique 15-digit IMEIs
        def generate_imeis(prefix, count):
            return [f"{prefix}{str(i+1).zfill(6)}" for i in range(count)]

        # 3. Comprehensive Products List (20+ Top Tech Products in Cambodia)
        products_data = [
            # === APPLE PHONES ===
            {
                'name': 'iPhone 15 Pro Max 256GB - Natural Titanium',
                'slug': 'iphone-15-pro-max-256gb-natural-titanium',
                'brand': brand_map['apple'],
                'category': cat_map['smartphones'],
                'barcode': '195949038234',
                'sku': 'IP15PM-256-NT',
                'color': 'Natural Titanium',
                'storage': '256GB',
                'wholesale_price': Decimal('1020.00'),
                'retail_price': Decimal('1199.00'),
                'discount_price': Decimal('1159.00'),
                'image_url': 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&auto=format&fit=crop&q=80',
                'requires_imei': True,
                'is_featured': True,
                'description': 'Aerospace-grade titanium design, A17 Pro chip, customizable Action button, and 5x telephoto camera system.',
                'specs': {
                    'Display': '6.7" Super Retina XDR OLED 120Hz ProMotion',
                    'Processor': 'Apple A17 Pro (3nm)',
                    'Main Camera': '48MP Quad-Pixel + 12MP Ultra-Wide + 12MP 5x Telephoto',
                    'Battery': 'Up to 29 hours video playback',
                    'Port': 'USB-C (USB 3 up to 10Gb/s)',
                    'Warranty': '1 Year Official Apple Cambodia Warranty'
                },
                'imeis': generate_imeis('354892019', 8)
            },
            {
                'name': 'iPhone 15 Pro 128GB - Blue Titanium',
                'slug': 'iphone-15-pro-128gb-blue-titanium',
                'brand': brand_map['apple'],
                'category': cat_map['smartphones'],
                'barcode': '195949038111',
                'sku': 'IP15P-128-BLU',
                'color': 'Blue Titanium',
                'storage': '128GB',
                'wholesale_price': Decimal('860.00'),
                'retail_price': Decimal('999.00'),
                'discount_price': Decimal('969.00'),
                'image_url': 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&auto=format&fit=crop&q=80',
                'requires_imei': True,
                'is_featured': True,
                'description': 'Compact pro power with titanium frame, A17 Pro chip, and 3x telephoto camera.',
                'specs': {
                    'Display': '6.1" Super Retina XDR OLED 120Hz',
                    'Processor': 'Apple A17 Pro (3nm)',
                    'Camera': '48MP Main + 12MP Ultra-Wide + 12MP 3x Telephoto',
                    'Warranty': '1 Year Official Apple Warranty'
                },
                'imeis': generate_imeis('354892020', 6)
            },
            {
                'name': 'iPhone 15 Plus 128GB - Pink',
                'slug': 'iphone-15-plus-128gb-pink',
                'brand': brand_map['apple'],
                'category': cat_map['smartphones'],
                'barcode': '195949038222',
                'sku': 'IP15PL-128-PNK',
                'color': 'Pink',
                'storage': '128GB',
                'wholesale_price': Decimal('760.00'),
                'retail_price': Decimal('899.00'),
                'discount_price': Decimal('869.00'),
                'image_url': 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&auto=format&fit=crop&q=80',
                'requires_imei': True,
                'is_featured': False,
                'description': 'Big 6.7-inch display, insane battery life, 48MP camera, Dynamic Island, and USB-C.',
                'specs': {
                    'Display': '6.7" Super Retina XDR OLED',
                    'Processor': 'Apple A16 Bionic',
                    'Camera': '48MP Main + 12MP Ultra-Wide',
                    'Battery': 'Up to 26 hours video'
                },
                'imeis': generate_imeis('354892021', 5)
            },
            {
                'name': 'iPhone 15 128GB - Black',
                'slug': 'iphone-15-128gb-black',
                'brand': brand_map['apple'],
                'category': cat_map['smartphones'],
                'barcode': '195949012391',
                'sku': 'IP15-128-BLK',
                'color': 'Black',
                'storage': '128GB',
                'wholesale_price': Decimal('680.00'),
                'retail_price': Decimal('799.00'),
                'discount_price': Decimal('769.00'),
                'image_url': 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&auto=format&fit=crop&q=80',
                'requires_imei': True,
                'is_featured': True,
                'description': 'Dynamic Island bubbles up alerts, 48MP Main camera with 2x Telephoto, color-infused glass, and aluminum design with USB-C.',
                'specs': {
                    'Display': '6.1" Super Retina XDR OLED',
                    'Processor': 'Apple A16 Bionic',
                    'Main Camera': '48MP Main + 12MP Ultra Wide',
                    'Warranty': '1 Year Official Warranty'
                },
                'imeis': generate_imeis('358920193', 6)
            },
            {
                'name': 'iPhone 13 128GB - Midnight',
                'slug': 'iphone-13-128gb-midnight',
                'brand': brand_map['apple'],
                'category': cat_map['smartphones'],
                'barcode': '194252706381',
                'sku': 'IP13-128-MID',
                'color': 'Midnight',
                'storage': '128GB',
                'wholesale_price': Decimal('470.00'),
                'retail_price': Decimal('549.00'),
                'discount_price': Decimal('529.00'),
                'image_url': 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&auto=format&fit=crop&q=80',
                'requires_imei': True,
                'is_featured': False,
                'description': 'The best value iPhone in Cambodia. Super Retina XDR display, Cinematic mode, A15 Bionic chip.',
                'specs': {
                    'Display': '6.1" Super Retina XDR OLED',
                    'Processor': 'Apple A15 Bionic',
                    'Camera': 'Dual 12MP System'
                },
                'imeis': generate_imeis('359019283', 7)
            },

            # === SAMSUNG PHONES ===
            {
                'name': 'Samsung Galaxy S24 Ultra 512GB - Titanium Gray',
                'slug': 'samsung-galaxy-s24-ultra-512gb-titanium-gray',
                'brand': brand_map['samsung'],
                'category': cat_map['smartphones'],
                'barcode': '880609538491',
                'sku': 'SM-S928B-512-GRY',
                'color': 'Titanium Gray',
                'storage': '512GB',
                'wholesale_price': Decimal('1080.00'),
                'retail_price': Decimal('1299.00'),
                'discount_price': Decimal('1249.00'),
                'image_url': 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=800&auto=format&fit=crop&q=80',
                'requires_imei': True,
                'is_featured': True,
                'description': 'Galaxy AI is here. Epic titanium armor, built-in S Pen, 200MP camera with AI ProVisual Engine, and Snapdragon 8 Gen 3 for Galaxy.',
                'specs': {
                    'Display': '6.8" Dynamic AMOLED 2X QHD+ 120Hz',
                    'Processor': 'Snapdragon 8 Gen 3 for Galaxy',
                    'Main Camera': '200MP + 50MP 5x + 10MP 3x + 12MP UW',
                    'Battery': '5,000mAh with 45W Fast Charging',
                    'Warranty': '1 Year Official Samsung Cambodia'
                },
                'imeis': generate_imeis('357284910', 8)
            },
            {
                'name': 'Samsung Galaxy S24+ 256GB - Cobalt Violet',
                'slug': 'samsung-galaxy-s24-plus-256gb-violet',
                'brand': brand_map['samsung'],
                'category': cat_map['smartphones'],
                'barcode': '880609538450',
                'sku': 'SM-S926B-256-VIO',
                'color': 'Cobalt Violet',
                'storage': '256GB',
                'wholesale_price': Decimal('780.00'),
                'retail_price': Decimal('949.00'),
                'discount_price': Decimal('899.00'),
                'image_url': 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=800&auto=format&fit=crop&q=80',
                'requires_imei': True,
                'is_featured': False,
                'description': 'QHD+ Dynamic AMOLED 2X display, Armor Aluminum 2.0, 4,900mAh battery, and full Galaxy AI suite.',
                'specs': {
                    'Display': '6.7" QHD+ Dynamic AMOLED 2X 120Hz',
                    'Processor': 'Exynos 2400 / Snapdragon 8 Gen 3',
                    'Camera': '50MP Triple Camera System'
                },
                'imeis': generate_imeis('357284920', 6)
            },
            {
                'name': 'Samsung Galaxy S24 256GB - Onyx Black',
                'slug': 'samsung-galaxy-s24-256gb-black',
                'brand': brand_map['samsung'],
                'category': cat_map['smartphones'],
                'barcode': '880609538420',
                'sku': 'SM-S921B-256-BLK',
                'color': 'Onyx Black',
                'storage': '256GB',
                'wholesale_price': Decimal('650.00'),
                'retail_price': Decimal('799.00'),
                'discount_price': Decimal('749.00'),
                'image_url': 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=800&auto=format&fit=crop&q=80',
                'requires_imei': True,
                'is_featured': False,
                'description': 'Compact flagship with Galaxy AI, Circle to Search, Live Translate, and stunning 6.2" display.',
                'specs': {
                    'Display': '6.2" FHD+ Dynamic AMOLED 2X 120Hz',
                    'Camera': '50MP Main + 10MP Telephoto + 12MP UW'
                },
                'imeis': generate_imeis('357284930', 5)
            },
            {
                'name': 'Samsung Galaxy Z Fold5 512GB - Phantom Black',
                'slug': 'samsung-galaxy-z-fold5-512gb-black',
                'brand': brand_map['samsung'],
                'category': cat_map['smartphones'],
                'barcode': '880609491099',
                'sku': 'SM-F946B-512-BLK',
                'color': 'Phantom Black',
                'storage': '512GB',
                'wholesale_price': Decimal('1290.00'),
                'retail_price': Decimal('1599.00'),
                'discount_price': Decimal('1499.00'),
                'image_url': 'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=800&auto=format&fit=crop&q=80',
                'requires_imei': True,
                'is_featured': True,
                'description': 'Unfold an immersive 7.6" screen. Massive power, zero-gap Flex Hinge, Multi-Window multitasking.',
                'specs': {
                    'Main Display': '7.6" QXGA+ Dynamic AMOLED 2X 120Hz',
                    'Cover Display': '6.2" Dynamic AMOLED 2X',
                    'Processor': 'Snapdragon 8 Gen 2 for Galaxy'
                },
                'imeis': generate_imeis('356192840', 4)
            },
            {
                'name': 'Samsung Galaxy Z Flip5 256GB - Mint',
                'slug': 'samsung-galaxy-z-flip5-256gb-mint',
                'brand': brand_map['samsung'],
                'category': cat_map['smartphones'],
                'barcode': '880609491023',
                'sku': 'SM-F731B-256-MNT',
                'color': 'Mint',
                'storage': '256GB',
                'wholesale_price': Decimal('710.00'),
                'retail_price': Decimal('849.00'),
                'discount_price': None,
                'image_url': 'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=800&auto=format&fit=crop&q=80',
                'requires_imei': True,
                'is_featured': False,
                'description': 'Pocket-sized innovation. 3.4-inch Flex Window cover screen, zero-gap Flex Hinge, hands-free FlexCam selfies.',
                'specs': {
                    'Display': '6.7" FHD+ Dynamic AMOLED 2X + 3.4" Cover Screen',
                    'Processor': 'Snapdragon 8 Gen 2 for Galaxy',
                    'Warranty': '1 Year Official Warranty'
                },
                'imeis': generate_imeis('356192850', 5)
            },
            {
                'name': 'Samsung Galaxy A55 5G 256GB - Awesome Iceblue',
                'slug': 'samsung-galaxy-a55-5g-256gb-iceblue',
                'brand': brand_map['samsung'],
                'category': cat_map['smartphones'],
                'barcode': '880609581902',
                'sku': 'SM-A556E-256-BLU',
                'color': 'Awesome Iceblue',
                'storage': '256GB',
                'wholesale_price': Decimal('320.00'),
                'retail_price': Decimal('399.00'),
                'discount_price': Decimal('379.00'),
                'image_url': 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=800&auto=format&fit=crop&q=80',
                'requires_imei': True,
                'is_featured': False,
                'description': 'Metal frame, Gorilla Glass Victus+, 50MP OIS camera, IP67 water resistance, 5,000mAh battery.',
                'specs': {
                    'Display': '6.6" Super AMOLED 120Hz FHD+',
                    'Processor': 'Exynos 1480 (4nm)',
                    'Camera': '50MP OIS + 12MP UW + 5MP Macro'
                },
                'imeis': generate_imeis('358192019', 8)
            },

            # === XIAOMI & REDMI PHONES ===
            {
                'name': 'Xiaomi 14 Ultra 512GB - Photography Kit Edition',
                'slug': 'xiaomi-14-ultra-512gb-photography-edition',
                'brand': brand_map['xiaomi'],
                'category': cat_map['smartphones'],
                'barcode': '693417778912',
                'sku': 'MI-14U-512-BLK',
                'color': 'Black Ceramic',
                'storage': '512GB',
                'wholesale_price': Decimal('820.00'),
                'retail_price': Decimal('999.00'),
                'discount_price': Decimal('959.00'),
                'image_url': 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&auto=format&fit=crop&q=80',
                'requires_imei': True,
                'is_featured': True,
                'description': 'Leica Quad Camera with 1-inch LYT-900 sensor, stepless variable aperture f/1.63-f/4.0, WQHD+ AMOLED display.',
                'specs': {
                    'Display': '6.73" WQHD+ 120Hz LTPO AMOLED',
                    'Optics': 'Leica Summilux Quad 50MP Lens',
                    'Processor': 'Snapdragon 8 Gen 3',
                    'Battery': '5,000mAh with 90W HyperCharge'
                },
                'imeis': generate_imeis('864920194', 6)
            },
            {
                'name': 'Xiaomi 14 512GB - Jade Green',
                'slug': 'xiaomi-14-512gb-green',
                'brand': brand_map['xiaomi'],
                'category': cat_map['smartphones'],
                'barcode': '693417778850',
                'sku': 'MI-14-512-GRN',
                'color': 'Jade Green',
                'storage': '512GB',
                'wholesale_price': Decimal('620.00'),
                'retail_price': Decimal('749.00'),
                'discount_price': Decimal('719.00'),
                'image_url': 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&auto=format&fit=crop&q=80',
                'requires_imei': True,
                'is_featured': False,
                'description': 'Ultra-thin bezel design, Leica Summilux optical lens, Snapdragon 8 Gen 3, and Xiaomi HyperOS.',
                'specs': {
                    'Display': '6.36" 1.5K 120Hz LTPO AMOLED',
                    'Optics': 'Leica 50MP Triple Camera',
                    'Charging': '90W wired + 50W wireless'
                },
                'imeis': generate_imeis('864920195', 5)
            },
            {
                'name': 'Redmi Note 13 Pro+ 5G 256GB - Midnight Black',
                'slug': 'redmi-note-13-pro-plus-5g-256gb-black',
                'brand': brand_map['xiaomi'],
                'category': cat_map['smartphones'],
                'barcode': '693417772390',
                'sku': 'RN13PP-256-BLK',
                'color': 'Midnight Black',
                'storage': '256GB',
                'wholesale_price': Decimal('295.00'),
                'retail_price': Decimal('369.00'),
                'discount_price': None,
                'image_url': 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=800&auto=format&fit=crop&q=80',
                'requires_imei': True,
                'is_featured': False,
                'description': '200MP OIS ultra-clear camera, curved 1.5K 120Hz AMOLED display, IP68 water & dust resistance, 120W HyperCharge.',
                'specs': {
                    'Display': '6.67" 1.5K Curved AMOLED 120Hz',
                    'Camera': '200MP Main with OIS',
                    'Charging': '120W in-box charger'
                },
                'imeis': generate_imeis('869284019', 10)
            },

            # === TABLETS & WEARABLES ===
            {
                'name': 'iPad Pro 11" M4 256GB Wi-Fi - Space Black',
                'slug': 'ipad-pro-11-m4-256gb-space-black',
                'brand': brand_map['apple'],
                'category': cat_map['tablets'],
                'barcode': '195949110099',
                'sku': 'IPAD-PRO-M4-256',
                'color': 'Space Black',
                'storage': '256GB',
                'wholesale_price': Decimal('870.00'),
                'retail_price': Decimal('999.00'),
                'discount_price': Decimal('979.00'),
                'image_url': 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800&auto=format&fit=crop&q=80',
                'requires_imei': True,
                'is_featured': True,
                'description': 'Ultra Retina XDR with Tandem OLED technology, revolutionary Apple M4 chip, ultra-thin 5.3mm design.',
                'specs': {
                    'Display': '11" Ultra Retina XDR Tandem OLED',
                    'Chip': 'Apple M4 9-core CPU, 10-core GPU',
                    'Support': 'Apple Pencil Pro & Magic Keyboard'
                },
                'imeis': generate_imeis('DMQZM4182', 6)
            },
            {
                'name': 'iPad Air 11" M2 128GB Wi-Fi - Space Gray',
                'slug': 'ipad-air-11-m2-128gb-space-gray',
                'brand': brand_map['apple'],
                'category': cat_map['tablets'],
                'barcode': '195949112233',
                'sku': 'IPAD-AIR-M2-128',
                'color': 'Space Gray',
                'storage': '128GB',
                'wholesale_price': Decimal('510.00'),
                'retail_price': Decimal('599.00'),
                'discount_price': None,
                'image_url': 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800&auto=format&fit=crop&q=80',
                'requires_imei': True,
                'is_featured': False,
                'description': 'Supercharged by Apple M2 chip. Liquid Retina display, landscape 12MP front camera with Center Stage, Wi-Fi 6E.',
                'specs': {
                    'Display': '11" Liquid Retina Display',
                    'Chip': 'Apple M2 with 8-core CPU, 10-core GPU',
                    'Support': 'Apple Pencil Pro & Magic Keyboard'
                },
                'imeis': generate_imeis('DMQZM2182', 5)
            },
            {
                'name': 'Apple Watch Ultra 2 (49mm Titanium - Orange Ocean Band)',
                'slug': 'apple-watch-ultra-2-49mm',
                'brand': brand_map['apple'],
                'category': cat_map['wearables'],
                'barcode': '195949081299',
                'sku': 'AW-ULTRA2-49',
                'color': 'Titanium',
                'storage': '64GB',
                'wholesale_price': Decimal('690.00'),
                'retail_price': Decimal('799.00'),
                'discount_price': None,
                'image_url': 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80',
                'requires_imei': True,
                'is_featured': True,
                'description': 'Rugged and capable titanium case, precision dual-frequency GPS, up to 72 hours of battery in Low Power Mode.',
                'specs': {
                    'Case': '49mm Aerospace-grade Titanium',
                    'Brightness': '3,000 nits Always-On Retina display',
                    'Water Resistance': '100m water resistant & dive ready'
                },
                'imeis': generate_imeis('AWU291028', 5)
            },

            # === GENUINE CHARGERS, POWER BANKS & ACCESSORIES ===
            {
                'name': 'Anker 737 Power Bank (PowerCore 24K 140W GaN)',
                'slug': 'anker-737-power-bank-24k-140w',
                'brand': brand_map['anker'],
                'category': cat_map['audio-power'],
                'barcode': '194644083816',
                'sku': 'ANK-737-24K',
                'color': 'Black / Silver',
                'storage': '',
                'wholesale_price': Decimal('65.00'),
                'retail_price': Decimal('99.00'),
                'discount_price': Decimal('89.00'),
                'image_url': 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=800&auto=format&fit=crop&q=80',
                'requires_imei': False,
                'accessory_stock': 35,
                'is_featured': True,
                'description': 'Ultra-powerful 140W two-way fast charging with smart digital display. Easily charges MacBook Pro, iPhone, and Galaxy simultaneously.',
                'specs': {
                    'Capacity': '24,000 mAh',
                    'Max Output': '140W Power Delivery 3.1',
                    'Ports': '2x USB-C + 1x USB-A'
                },
                'imeis': []
            },
            {
                'name': 'Anker Prime 67W 3-Port GaN Wall Charger',
                'slug': 'anker-prime-67w-gan-charger',
                'brand': brand_map['anker'],
                'category': cat_map['audio-power'],
                'barcode': '194644141028',
                'sku': 'ANK-PRIME-67W',
                'color': 'Space Gray',
                'storage': '',
                'wholesale_price': Decimal('32.00'),
                'retail_price': Decimal('49.00'),
                'discount_price': None,
                'image_url': 'https://images.unsplash.com/photo-1622445262464-84b1456045b6?w=800&auto=format&fit=crop&q=80',
                'requires_imei': False,
                'accessory_stock': 50,
                'is_featured': False,
                'description': 'GaNPrime technology charges 3 devices simultaneously with dynamic power distribution.',
                'specs': {
                    'Power': '67W Max',
                    'Ports': '2x USB-C + 1x USB-A'
                },
                'imeis': []
            },
            {
                'name': 'Apple 20W USB-C Power Adapter (Original)',
                'slug': 'apple-20w-usb-c-power-adapter',
                'brand': brand_map['apple'],
                'category': cat_map['audio-power'],
                'barcode': '194252157015',
                'sku': 'MHJA3AM-A',
                'color': 'White',
                'storage': '',
                'wholesale_price': Decimal('14.00'),
                'retail_price': Decimal('25.00'),
                'discount_price': None,
                'image_url': 'https://images.unsplash.com/photo-1622445262464-84b1456045b6?w=800&auto=format&fit=crop&q=80',
                'requires_imei': False,
                'accessory_stock': 80,
                'is_featured': False,
                'description': 'Genuine Apple 20W USB-C Power Adapter offers fast, efficient charging at home, in the office, or on the go.',
                'specs': {
                    'Output': '20W Fast Charge',
                    'Compatibility': 'iPhone 15/14/13/12 series, iPad Pro'
                },
                'imeis': []
            },
            {
                'name': 'Baseus Magnetic Wireless Power Bank 10,000mAh (20W MagSafe)',
                'slug': 'baseus-magnetic-powerbank-10k',
                'brand': brand_map['baseus'],
                'category': cat_map['audio-power'],
                'barcode': '693217260812',
                'sku': 'BAS-MAG-10K-WHT',
                'color': 'White',
                'storage': '',
                'wholesale_price': Decimal('22.00'),
                'retail_price': Decimal('38.00'),
                'discount_price': Decimal('34.00'),
                'image_url': 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=800&auto=format&fit=crop&q=80',
                'requires_imei': False,
                'accessory_stock': 40,
                'is_featured': False,
                'description': 'Strong magnetic lock for iPhone 15/14/13/12 MagSafe with 20W PD wired fast charge.',
                'specs': {
                    'Capacity': '10,000mAh',
                    'Wireless Output': '15W MagSafe',
                    'Wired Output': '20W USB-C PD'
                },
                'imeis': []
            },
            {
                'name': 'Spigen Ultra Hybrid MagFit Case - iPhone 15 Pro Max',
                'slug': 'spigen-ultra-hybrid-magfit-iphone-15-pro-max',
                'brand': brand_map['spigen'],
                'category': cat_map['cases-protection'],
                'barcode': '880989674891',
                'sku': 'SPG-UH-IP15PM-CLR',
                'color': 'Crystal Clear',
                'storage': '',
                'wholesale_price': Decimal('12.00'),
                'retail_price': Decimal('29.00'),
                'discount_price': None,
                'image_url': 'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=800&auto=format&fit=crop&q=80',
                'requires_imei': False,
                'accessory_stock': 65,
                'is_featured': False,
                'description': 'Crystal clear military-grade protection with integrated magnetic ring for seamless MagSafe charging and accessories.',
                'specs': {
                    'Protection': 'Air Cushion Technology MIL-STD',
                    'MagSafe': 'Fully Compatible'
                },
                'imeis': []
            },
            {
                'name': 'Belkin UltraGlass 2 Screen Protector - iPhone 15 Pro Max',
                'slug': 'belkin-ultraglass-2-iphone-15-pro-max',
                'brand': brand_map['belkin'],
                'category': cat_map['cases-protection'],
                'barcode': '745883859102',
                'sku': 'BLK-UG2-IP15PM',
                'color': 'Transparent',
                'storage': '',
                'wholesale_price': Decimal('8.00'),
                'retail_price': Decimal('19.00'),
                'discount_price': None,
                'image_url': 'https://images.unsplash.com/photo-1584438784894-089d6a62b8fa?w=800&auto=format&fit=crop&q=80',
                'requires_imei': False,
                'accessory_stock': 90,
                'is_featured': False,
                'description': 'Up to 2.7x stronger than tempered glass with lithium aluminosilicate engineered glass for ultimate scratch and drop defense.',
                'specs': {
                    'Hardness': '9H+ Double-Ion Exchange',
                    'Includes': 'Easy Align tray for flawless bubble-free application'
                },
                'imeis': []
            },
        ]

        total_imeis_count = 0
        for p_info in products_data:
            imeis = p_info.pop('imeis', [])
            prod, created = Product.objects.get_or_create(
                slug=p_info['slug'],
                defaults=p_info
            )
            if not created:
                for key, value in p_info.items():
                    setattr(prod, key, value)
                prod.save()

            if prod.requires_imei:
                for im in imeis:
                    ProductIMEI.objects.get_or_create(
                        product=prod,
                        imei=im,
                        defaults={'status': 'AVAILABLE'}
                    )
                    total_imeis_count += 1

        # 4. Initialize today's Daily Ledger
        today = timezone.localdate()
        DailyLedger.objects.get_or_create(
            date=today,
            defaults={
                'opening_cash': Decimal('200.00'),
                'cash_sales': Decimal('0.00'),
                'aba_sales': Decimal('0.00'),
                'card_sales': Decimal('0.00'),
                'online_sales': Decimal('0.00'),
                'total_revenue': Decimal('0.00'),
                'total_profit': Decimal('0.00'),
                'order_count': 0
            }
        )

        self.stdout.write(self.style.SUCCESS(
            f"Successfully seeded {len(products_data)} flagship products and {total_imeis_count} serialized IMEIs!"
        ))
