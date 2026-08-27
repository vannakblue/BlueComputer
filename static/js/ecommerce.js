// Blue Computer E-Commerce Client Logic with Bakong KHQR
let currentProducts = [];
let selectedBrand = 'all';
let selectedCategory = 'all';
let searchQuery = '';
let currentSort = '-created_at';
let cart = JSON.parse(localStorage.getItem('bc_ecommerce_cart') || '[]');
let pendingOrderData = null;
let ecommerceKhqrPollInterval = null;
let ecommerceKhqrTimerInterval = null;
let ecommerceKhqrSecondsLeft = 180;

document.addEventListener('DOMContentLoaded', () => {
    loadProducts();
    updateCartUI();
    setupEventListeners();

    window.addEventListener('inventory_updated', () => {
        loadProducts(false);
    });

    window.addEventListener('language_changed', () => {
        renderProductGrid(currentProducts);
        updateCartUI();
    });
});

function setupEventListeners() {
    const searchInput = document.getElementById('catalog-search');
    if (searchInput) {
        let debounceTimer;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                searchQuery = e.target.value;
                loadProducts();
            }, 300);
        });
    }

    const sortSelect = document.getElementById('catalog-sort');
    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            currentSort = e.target.value;
            loadProducts();
        });
    }

    document.querySelectorAll('.brand-filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.brand-filter-btn').forEach(b => {
                b.className = 'brand-filter-btn px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all';
            });
            btn.className = 'brand-filter-btn px-4 py-2 rounded-xl text-xs font-bold transition-all bg-blue-600 text-white shadow-md shadow-blue-600/30';
            selectedBrand = btn.dataset.brand;
            loadProducts();
        });
    });

    document.querySelectorAll('.category-filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.category-filter-btn').forEach(b => {
                b.className = 'category-filter-btn px-3 py-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-white border border-slate-800';
            });
            btn.className = 'category-filter-btn px-3 py-1.5 rounded-lg bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30';
            selectedCategory = btn.dataset.category;
            loadProducts();
        });
    });

    const cartToggle = document.getElementById('cart-toggle-btn');
    const closeCart = document.getElementById('close-cart-btn');
    const cartDrawer = document.getElementById('cart-drawer');
    if (cartToggle && cartDrawer) {
        cartToggle.addEventListener('click', () => {
            cartDrawer.classList.remove('translate-x-full');
        });
    }
    if (closeCart && cartDrawer) {
        closeCart.addEventListener('click', () => {
            cartDrawer.classList.add('translate-x-full');
        });
    }

    const openCheckoutBtn = document.getElementById('open-checkout-btn');
    if (openCheckoutBtn) {
        openCheckoutBtn.addEventListener('click', () => {
            if (cart.length === 0) {
                showToast('Your cart is empty!', 'warning');
                return;
            }
            if (cartDrawer) cartDrawer.classList.add('translate-x-full');
            openCheckoutModal();
        });
    }

    document.querySelectorAll('input[name="payment_method"]').forEach(radio => {
        radio.addEventListener('change', (e) => {
            document.querySelectorAll('.payment-method-card').forEach(card => {
                card.classList.remove('border-rose-500/50', 'bg-rose-950/20', 'border-cyan-500/50', 'bg-cyan-950/20');
                card.classList.add('border-slate-700', 'bg-slate-900');
            });
            const parent = e.target.closest('.payment-method-card');
            if (parent) {
                parent.classList.remove('border-slate-700', 'bg-slate-900');
                parent.classList.add('border-rose-500/50', 'bg-rose-950/20');
            }
        });
    });

    const checkoutForm = document.getElementById('checkout-form');
    if (checkoutForm) {
        checkoutForm.addEventListener('submit', handleCheckoutSubmit);
    }
}

async function loadProducts(showLoading = true) {
    const grid = document.getElementById('products-grid');
    const countBadge = document.getElementById('product-count-badge');
    if (showLoading && grid) {
        grid.innerHTML = `
            <div class="col-span-full py-16 text-center text-slate-500">
                <i data-lucide="loader-2" class="w-8 h-8 animate-spin mx-auto mb-2 text-cyan-400"></i>
                <p>Loading Blue Computer catalog...</p>
            </div>
        `;
        lucide.createIcons();
    }

    try {
        const url = new URL('/api/products/', window.location.origin);
        if (selectedBrand && selectedBrand !== 'all') url.searchParams.append('brand', selectedBrand);
        if (selectedCategory && selectedCategory !== 'all') url.searchParams.append('category', selectedCategory);
        if (searchQuery) url.searchParams.append('search', searchQuery);
        if (currentSort) url.searchParams.append('ordering', currentSort);

        const res = await fetch(url);
        if (!res.ok) throw new Error('Failed to load products');
        
        currentProducts = await res.json();
        if (countBadge) countBadge.innerText = `${currentProducts.length} Items`;
        renderProductGrid(currentProducts);
    } catch (e) {
        if (grid) {
            grid.innerHTML = `
                <div class="col-span-full py-12 text-center text-rose-400">
                    <p>Failed to load catalog. Please retry.</p>
                </div>
            `;
        }
    }
}

function renderProductGrid(products) {
    const grid = document.getElementById('products-grid');
    if (!grid) return;

    if (products.length === 0) {
        grid.innerHTML = `
            <div class="col-span-full py-16 text-center text-slate-400 space-y-2">
                <i data-lucide="smartphone-nfc" class="w-12 h-12 mx-auto text-slate-600"></i>
                <p class="text-sm font-semibold">No products match your filter criteria.</p>
                <button onclick="resetFilters()" class="text-xs text-cyan-400 hover:underline">Reset Filters</button>
            </div>
        `;
        lucide.createIcons();
        return;
    }

    grid.innerHTML = products.map(p => {
        const inStock = p.current_stock > 0;
        const hasDiscount = p.discount_price && parseFloat(p.discount_price) < parseFloat(p.retail_price);
        const price = parseFloat(p.effective_price).toFixed(2);
        const retailPrice = parseFloat(p.retail_price).toFixed(2);

        const inStockText = window.i18n ? window.i18n.get('in_stock') : 'In Stock';
        const outOfStockText = window.i18n ? window.i18n.get('out_of_stock') : 'Out of Stock';
        const addText = window.i18n ? window.i18n.get('add_to_cart') : 'Add';
        const soldOutText = window.i18n ? window.i18n.get('sold_out') : 'Sold Out';
        const quickViewText = window.i18n ? window.i18n.get('quick_view') : 'Quick View';

        return `
            <div class="glass-card-interactive rounded-2xl overflow-hidden flex flex-col p-4 relative group">
                <div class="flex items-center justify-between gap-2 mb-3">
                    <span class="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                        ${p.brand_name || 'Tech'}
                    </span>
                    ${inStock ? `
                        <span class="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                            <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                            ${p.current_stock} ${inStockText}
                        </span>
                    ` : `
                        <span class="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30">
                            ${outOfStockText}
                        </span>
                    `}
                </div>

                <div class="relative w-full h-44 mb-3 overflow-hidden rounded-xl bg-slate-950 flex items-center justify-center cursor-pointer" onclick="openProductModal(${p.id})">
                    <img src="${p.image_url || 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=600'}" 
                         alt="${p.name}" 
                         class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300">
                    <button class="absolute bottom-2 right-2 px-2.5 py-1 rounded-lg bg-slate-900/90 text-slate-200 text-[10px] font-semibold opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm border border-slate-700">
                        ${quickViewText}
                    </button>
                </div>

                <div class="flex-1 flex flex-col justify-between space-y-3">
                    <div>
                        <h4 class="font-bold text-sm text-white group-hover:text-cyan-400 transition-colors line-clamp-1 cursor-pointer" onclick="openProductModal(${p.id})">
                            ${p.name}
                        </h4>
                        <div class="flex items-center gap-2 mt-1 text-[11px] text-slate-400 font-mono">
                            <span>SKU: ${p.sku}</span>
                            ${p.storage ? `<span>• ${p.storage}</span>` : ''}
                        </div>
                    </div>

                    <div class="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                        <div>
                            <div class="text-base font-extrabold text-cyan-400">$${price}</div>
                            ${hasDiscount ? `<div class="text-[10px] text-slate-500 line-through">$${retailPrice}</div>` : ''}
                        </div>
                        <button onclick="addToCart(${p.id})" 
                                ${!inStock ? 'disabled' : ''} 
                                class="px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${inStock ? 'bg-blue-600 hover:bg-cyan-400 hover:text-slate-950 text-white shadow-md shadow-blue-600/30' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}">
                            <i data-lucide="plus" class="w-3.5 h-3.5"></i>
                            <span>${inStock ? addText : soldOutText}</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    lucide.createIcons();
}

function resetFilters() {
    selectedBrand = 'all';
    selectedCategory = 'all';
    searchQuery = '';
    const searchInput = document.getElementById('catalog-search');
    if (searchInput) searchInput.value = '';
    loadProducts();
}

function scrollToProducts() {
    const el = document.getElementById('catalog-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
}

// Cart System
function addToCart(productId) {
    const product = currentProducts.find(p => p.id === productId);
    if (!product || product.current_stock <= 0) {
        showToast('Product is currently unavailable', 'error');
        return;
    }

    const existingIndex = cart.findIndex(it => it.product_id === productId);
    if (existingIndex > -1) {
        if (cart[existingIndex].quantity >= product.current_stock) {
            showToast(`Only ${product.current_stock} unit(s) available in stock!`, 'warning');
            return;
        }
        cart[existingIndex].quantity += 1;
    } else {
        cart.push({
            product_id: product.id,
            name: product.name,
            sku: product.sku,
            unit_price: parseFloat(product.effective_price),
            image_url: product.image_url,
            max_stock: product.current_stock,
            quantity: 1
        });
    }

    saveCart();
    updateCartUI();
    showToast(`Added ${product.name} to cart`, 'success');

    const cartDrawer = document.getElementById('cart-drawer');
    if (cartDrawer) cartDrawer.classList.remove('translate-x-full');
}

function updateCartItemQty(productId, delta) {
    const item = cart.find(it => it.product_id === productId);
    if (!item) return;

    item.quantity += delta;
    if (item.quantity <= 0) {
        cart = cart.filter(it => it.product_id !== productId);
    } else if (item.quantity > item.max_stock) {
        item.quantity = item.max_stock;
        showToast(`Maximum available stock reached (${item.max_stock})`, 'warning');
    }
    saveCart();
    updateCartUI();
}

function removeFromCart(productId) {
    cart = cart.filter(it => it.product_id !== productId);
    saveCart();
    updateCartUI();
}

function saveCart() {
    localStorage.setItem('bc_ecommerce_cart', JSON.stringify(cart));
}

function updateCartUI() {
    const badge = document.getElementById('cart-badge-count');
    const drawerCount = document.getElementById('drawer-item-count');
    const container = document.getElementById('cart-items-container');
    const subtotalEl = document.getElementById('drawer-subtotal');
    const deliveryFeeEl = document.getElementById('drawer-delivery-fee');
    const totalEl = document.getElementById('drawer-total');

    const totalQty = cart.reduce((sum, it) => sum + it.quantity, 0);
    if (badge) badge.innerText = totalQty;
    if (drawerCount) drawerCount.innerText = `${totalQty} items`;

    let subtotal = 0;
    cart.forEach(it => {
        subtotal += it.unit_price * it.quantity;
    });

    const deliveryFee = subtotal >= 500 || subtotal === 0 ? 0.00 : 1.50;
    const finalTotal = subtotal + deliveryFee;

    if (subtotalEl) subtotalEl.innerText = `$${subtotal.toFixed(2)}`;
    if (deliveryFeeEl) deliveryFeeEl.innerText = deliveryFee === 0 ? 'FREE (Orders > $500)' : `$${deliveryFee.toFixed(2)}`;
    if (totalEl) totalEl.innerText = `$${finalTotal.toFixed(2)}`;

    if (!container) return;

    if (cart.length === 0) {
        container.innerHTML = `
            <div class="py-16 text-center text-slate-500 space-y-3">
                <i data-lucide="shopping-bag" class="w-10 h-10 mx-auto text-slate-700"></i>
                <p class="text-xs font-semibold">Your shopping bag is empty.</p>
            </div>
        `;
        lucide.createIcons();
        return;
    }

    container.innerHTML = cart.map(it => `
        <div class="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center gap-3">
            <img src="${it.image_url || 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=200'}" class="w-12 h-12 object-cover rounded-lg bg-slate-900 shrink-0">
            <div class="flex-1 min-w-0">
                <h5 class="text-xs font-bold text-white truncate">${it.name}</h5>
                <div class="text-[11px] font-mono text-cyan-400 font-extrabold">$${it.unit_price.toFixed(2)}</div>
            </div>
            <div class="flex items-center gap-1.5 bg-slate-900 border border-slate-700 rounded-lg p-1">
                <button onclick="updateCartItemQty(${it.product_id}, -1)" class="w-5 h-5 rounded flex items-center justify-center text-slate-300 hover:bg-slate-800">-</button>
                <span class="text-xs font-mono font-bold px-1">${it.quantity}</span>
                <button onclick="updateCartItemQty(${it.product_id}, 1)" class="w-5 h-5 rounded flex items-center justify-center text-slate-300 hover:bg-slate-800">+</button>
            </div>
            <button onclick="removeFromCart(${it.product_id})" class="text-slate-500 hover:text-rose-400 p-1">
                <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
        </div>
    `).join('');

    lucide.createIcons();
}

// Product Details Modal
async function openProductModal(productId) {
    const modal = document.getElementById('product-modal');
    const content = document.getElementById('modal-product-content');
    if (!modal || !content) return;

    modal.classList.remove('hidden');
    modal.classList.add('flex');
    content.innerHTML = `
        <div class="py-12 text-center text-slate-400">
            <i data-lucide="loader-2" class="w-6 h-6 animate-spin mx-auto text-cyan-400"></i>
        </div>
    `;
    lucide.createIcons();

    try {
        const res = await fetch(`/api/products/${productId}/`);
        if (!res.ok) throw new Error('Not found');
        const p = await res.json();

        const specsEntries = Object.entries(p.specs || {});
        content.innerHTML = `
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <img src="${p.image_url || 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800'}" class="w-full h-64 object-cover rounded-2xl bg-slate-950 border border-slate-800 shadow-xl">
                    <div class="flex items-center gap-2 mt-3 text-xs font-mono text-emerald-400">
                        <i data-lucide="shield-check" class="w-4 h-4"></i>
                        <span>100% Genuine Certified Device</span>
                    </div>
                </div>

                <div class="space-y-4">
                    <div>
                        <span class="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-blue-500/20 text-cyan-300 border border-blue-500/30">${p.brand_name}</span>
                        <h3 class="text-xl font-extrabold text-white mt-1">${p.name}</h3>
                        <p class="text-xs text-slate-400 mt-1">${p.description || 'Premium mobile smartphone.'}</p>
                    </div>

                    <div class="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                        <div>
                            <span class="text-xs text-slate-400 block">Retail Price:</span>
                            <span class="text-2xl font-black text-cyan-400">$${parseFloat(p.effective_price).toFixed(2)}</span>
                        </div>
                        <div class="text-right">
                            <span class="text-xs text-slate-400 block">Stock In Store:</span>
                            <span class="text-sm font-mono font-bold ${p.current_stock > 0 ? 'text-emerald-400' : 'text-rose-400'}">${p.current_stock} Available</span>
                        </div>
                    </div>

                    ${specsEntries.length > 0 ? `
                        <div class="space-y-1.5 pt-2 border-t border-slate-800">
                            <h5 class="text-xs font-bold text-slate-300">Technical Specifications:</h5>
                            <div class="space-y-1 text-xs">
                                ${specsEntries.map(([k, v]) => `
                                    <div class="flex justify-between py-1 border-b border-slate-800/40 text-slate-400">
                                        <span class="font-medium text-slate-300">${k}:</span>
                                        <span class="text-slate-200 font-mono text-right">${v}</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}

                    <div class="pt-3">
                        <button onclick="addToCart(${p.id}); closeProductModal();" 
                                ${p.current_stock <= 0 ? 'disabled' : ''} 
                                class="w-full btn-neon py-3 rounded-xl font-bold text-slate-950 text-xs flex items-center justify-center gap-2">
                            <i data-lucide="shopping-bag" class="w-4 h-4"></i>
                            <span>${p.current_stock > 0 ? 'Add to Cart Now' : 'Out of Stock'}</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
        lucide.createIcons();
    } catch (err) {
        content.innerHTML = `<p class="text-rose-400 text-center py-6">Error loading product details.</p>`;
    }
}

function closeProductModal() {
    const modal = document.getElementById('product-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}

// Checkout Modal
function openCheckoutModal() {
    const modal = document.getElementById('checkout-modal');
    const totalEl = document.getElementById('checkout-final-total');
    if (!modal) return;

    let subtotal = cart.reduce((sum, it) => sum + (it.unit_price * it.quantity), 0);
    let fee = subtotal >= 500 ? 0.00 : 1.50;
    if (totalEl) totalEl.innerText = `$${(subtotal + fee).toFixed(2)}`;

    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function closeCheckoutModal() {
    const modal = document.getElementById('checkout-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}

async function handleCheckoutSubmit(e) {
    e.preventDefault();
    const btn = document.getElementById('submit-order-btn');
    const btnText = document.getElementById('submit-btn-text');
    if (btn) btn.disabled = true;
    if (btnText) btnText.innerText = 'Transmitting Order...';

    const custName = document.getElementById('cust-name').value;
    const custPhone = document.getElementById('cust-phone').value;
    const custCity = document.getElementById('cust-city').value;
    const custDistrict = document.getElementById('cust-district').value;
    const custAddress = document.getElementById('cust-address').value;
    const paymentMethod = document.querySelector('input[name="payment_method"]:checked')?.value || 'ABA_PAY';

    const orderPayload = {
        customer_name: custName,
        customer_phone: custPhone,
        delivery_city: custCity,
        delivery_district: custDistrict,
        delivery_address: custAddress,
        payment_method: paymentMethod,
        items: cart.map(it => ({ product_id: it.product_id, quantity: it.quantity }))
    };

    try {
        const res = await fetch('/api/ecommerce/checkout/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderPayload)
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to place order');

        pendingOrderData = data;
        closeCheckoutModal();

        if (paymentMethod === 'ABA_PAY') {
            openAbaModal(data);
        } else {
            showOrderSuccess(data);
        }
    } catch (err) {
        showToast(err.message, 'error');
    } finally {
        if (btn) btn.disabled = false;
        if (btnText) btnText.innerText = 'Confirm & Pay';
    }
}

// Bakong KHQR Modal in E-Commerce
async function openAbaModal(orderData) {
    const modal = document.getElementById('aba-qr-modal');
    const totalEl = document.getElementById('qr-total-amount');
    const totalKhrEl = document.getElementById('qr-total-khr-amount');
    const orderNumEl = document.getElementById('qr-order-num');
    const imgEl = document.getElementById('ecommerce-khqr-img');
    const loadingEl = document.getElementById('ecommerce-khqr-loading');
    const mobileLink = document.getElementById('ecommerce-mobile-scan-link');

    if (totalEl) totalEl.innerText = `$${parseFloat(orderData.total_amount).toFixed(2)}`;
    if (orderNumEl) orderNumEl.innerText = orderData.order_number;
    if (loadingEl) loadingEl.classList.remove('hidden');

    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }

    try {
        const khqrRes = await fetch('/api/payment/khqr/generate/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                order_number: orderData.order_number,
                amount: orderData.total_amount,
                currency: 'USD'
            })
        });

        const khqrData = await khqrRes.json();
        if (imgEl) imgEl.src = khqrData.qr_image_base64;
        if (totalKhrEl) totalKhrEl.innerText = `≈ ${khqrData.amount_khr} KHR`;
        if (mobileLink) mobileLink.href = khqrData.mobile_pay_url;
        if (loadingEl) loadingEl.classList.add('hidden');

        startEcommerceKhqrPolling(orderData.order_number);
    } catch (e) {
        showToast('Error generating KHQR', 'error');
    }
}

function startEcommerceKhqrPolling(orderNumber) {
    stopEcommerceKhqrPolling();

    ecommerceKhqrSecondsLeft = 180;
    const timerEl = document.getElementById('ecommerce-khqr-timer');
    if (timerEl) timerEl.innerText = '03:00';

    ecommerceKhqrTimerInterval = setInterval(() => {
        ecommerceKhqrSecondsLeft--;
        if (ecommerceKhqrSecondsLeft <= 0) {
            stopEcommerceKhqrPolling();
            if (timerEl) timerEl.innerText = 'Expired';
            return;
        }
        const mins = String(Math.floor(ecommerceKhqrSecondsLeft / 60)).padStart(2, '0');
        const secs = String(ecommerceKhqrSecondsLeft % 60).padStart(2, '0');
        if (timerEl) timerEl.innerText = `${mins}:${secs}`;
    }, 1000);

    ecommerceKhqrPollInterval = setInterval(async () => {
        try {
            const res = await fetch(`/api/payment/khqr/status/${orderNumber}/`);
            if (res.ok) {
                const data = await res.json();
                if (data.payment_status === 'PAID') {
                    stopEcommerceKhqrPolling();
                    closeAbaModal();
                    showToast('🎉 ABA KHQR payment approved successfully!', 'success');
                    if (pendingOrderData) {
                        showOrderSuccess(pendingOrderData);
                    }
                }
            }
        } catch (e) {}
    }, 1500);
}

function stopEcommerceKhqrPolling() {
    if (ecommerceKhqrPollInterval) clearInterval(ecommerceKhqrPollInterval);
    if (ecommerceKhqrTimerInterval) clearInterval(ecommerceKhqrTimerInterval);
    ecommerceKhqrPollInterval = null;
    ecommerceKhqrTimerInterval = null;
}

function closeAbaModal() {
    const modal = document.getElementById('aba-qr-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
    stopEcommerceKhqrPolling();
}

async function simulateCustomerPaymentSuccess() {
    if (pendingOrderData) {
        try {
            await fetch(`/api/payment/khqr/approve/${pendingOrderData.order_number}/`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            closeAbaModal();
            showToast('Payment verified via ABA Pay! In-store staff alerted.', 'success');
            showOrderSuccess(pendingOrderData);
        } catch (e) {
            showToast('Error approving payment', 'error');
        }
    }
}

function showOrderSuccess(orderData) {
    cart = [];
    saveCart();
    updateCartUI();

    const modal = document.getElementById('order-success-modal');
    const orderNum = document.getElementById('success-order-num');
    const district = document.getElementById('success-district');
    const trackLink = document.getElementById('track-order-link');

    if (orderNum) orderNum.innerText = orderData.order_number;
    if (district) district.innerText = document.getElementById('cust-district')?.value || 'Phnom Penh';
    if (trackLink) trackLink.href = `/track/${orderData.order_number}/`;

    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }
}

function closeSuccessModal() {
    const modal = document.getElementById('order-success-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}
