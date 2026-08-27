// Blue Computer In-Store POS Controller with Dynamic Bakong KHQR Scan & Pay
let posProducts = [];
let posCart = []; // [{ product, quantity, unit_price, selected_imeis: [] }]
let currentPosCat = 'all';
let currentPaymentMethod = 'CASH';
let activeImeiSelectionIndex = null;
let lastReceiptData = null;
let currentPosOrderNumber = null;
let khqrPollInterval = null;
let khqrTimerInterval = null;
let khqrSecondsLeft = 180;

document.addEventListener('DOMContentLoaded', () => {
    loadPosProducts();
    setupPosListeners();
    loadFulfillmentOrders();

    // Listen to real-time events
    window.addEventListener('inventory_updated', () => {
        loadPosProducts(false);
    });

    window.addEventListener('new_online_order', () => {
        loadFulfillmentOrders();
    });

    window.addEventListener('order_status_changed', () => {
        loadFulfillmentOrders();
    });

    window.addEventListener('language_changed', () => {
        filterAndRenderPosTiles();
        renderPosCart();
    });
});

function setupPosListeners() {
    const barcodeInput = document.getElementById('pos-barcode-input');
    if (barcodeInput) {
        barcodeInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                handleBarcodeScanTrigger();
            }
        });
    }

    document.querySelectorAll('.pos-cat-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.pos-cat-btn').forEach(b => {
                b.className = 'pos-cat-btn px-3 py-1.5 rounded-xl font-medium text-slate-400 bg-slate-900 border border-slate-800 hover:text-white';
            });
            btn.className = 'pos-cat-btn px-3 py-1.5 rounded-xl font-bold bg-blue-600 text-white shadow-sm';
            currentPosCat = btn.dataset.cat;
            filterAndRenderPosTiles();
        });
    });

    const discountInput = document.getElementById('pos-discount-input');
    if (discountInput) {
        discountInput.addEventListener('input', () => {
            updatePosCartTotals();
        });
    }

    const cashReceivedInput = document.getElementById('pos-cash-received');
    if (cashReceivedInput) {
        cashReceivedInput.addEventListener('input', updateChangeCalculation);
    }
}

async function loadPosProducts(showLoading = true) {
    const grid = document.getElementById('pos-product-grid');
    const countBadge = document.getElementById('pos-product-count');

    try {
        const res = await fetch('/api/products/');
        if (!res.ok) throw new Error('Failed to load products');
        posProducts = await res.json();
        if (countBadge) countBadge.innerText = `${posProducts.length} items loaded`;
        filterAndRenderPosTiles();
    } catch (e) {
        if (grid && showLoading) {
            grid.innerHTML = `<div class="col-span-full py-12 text-center text-rose-400 text-xs">Error loading catalog.</div>`;
        }
    }
}

function filterAndRenderPosTiles() {
    const grid = document.getElementById('pos-product-grid');
    if (!grid) return;

    let filtered = posProducts;
    if (currentPosCat !== 'all') {
        filtered = posProducts.filter(p => p.category_name.toLowerCase().includes(currentPosCat) || p.slug.includes(currentPosCat));
    }

    grid.innerHTML = filtered.map(p => {
        const inStock = p.current_stock > 0;
        const price = parseFloat(p.effective_price).toFixed(2);

        return `
            <div onclick="addPosItem(${p.id})" 
                 class="glass-card-interactive rounded-xl p-3 flex flex-col justify-between cursor-pointer border select-none ${inStock ? 'border-slate-800 hover:border-cyan-400/60' : 'opacity-50 border-slate-900 cursor-not-allowed'}">
                <div class="flex items-start justify-between gap-1 mb-2">
                    <span class="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">${p.brand_name}</span>
                    <span class="text-[10px] font-mono px-1.5 py-0.5 rounded ${inStock ? 'bg-emerald-500/15 text-emerald-400 font-bold' : 'bg-rose-500/20 text-rose-400'}">
                        ${inStock ? `${p.current_stock} in stock` : 'Out of stock'}
                    </span>
                </div>

                <div class="flex items-center gap-2.5 my-1">
                    <img src="${p.image_url || 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=100'}" class="w-12 h-12 object-cover rounded-lg bg-slate-950 shrink-0">
                    <div class="min-w-0 flex-1">
                        <h4 class="font-bold text-xs text-white line-clamp-2 leading-tight">${p.name}</h4>
                        <span class="text-[10px] font-mono text-slate-500 block truncate">${p.sku}</span>
                    </div>
                </div>

                <div class="flex items-center justify-between pt-2 border-t border-slate-800/80 mt-1">
                    <span class="text-xs font-black text-cyan-400 font-mono">$${price}</span>
                    <span class="text-[10px] text-blue-400 flex items-center gap-0.5 font-semibold">
                        <i data-lucide="plus-circle" class="w-3 h-3"></i> Add
                    </span>
                </div>
            </div>
        `;
    }).join('');

    lucide.createIcons();
}

// Barcode Lookup Trigger
async function handleBarcodeScanTrigger() {
    const input = document.getElementById('pos-barcode-input');
    if (!input || !input.value.trim()) return;

    const query = input.value.trim();
    input.value = '';

    try {
        const res = await fetch(`/api/pos/lookup/?code=${encodeURIComponent(query)}`);
        if (!res.ok) {
            const match = posProducts.find(p => 
                p.barcode === query || 
                p.sku.toLowerCase() === query.toLowerCase() ||
                p.name.toLowerCase().includes(query.toLowerCase())
            );
            if (match) {
                addPosItem(match.id);
                showToast(`Added: ${match.name}`, 'success');
                return;
            }
            throw new Error(`Product or IMEI '${query}' not recognized.`);
        }

        const data = await res.json();
        const p = data.product;
        const specificImei = data.match_type === 'IMEI' ? data.imei : null;

        addPosItem(p.id, specificImei);
        showToast(`Scanned: ${p.name} ${specificImei ? `[IMEI: ${specificImei}]` : ''}`, 'success');
    } catch (e) {
        showToast(e.message, 'error');
    }
}

function simulateScan(barcode) {
    const input = document.getElementById('pos-barcode-input');
    if (input) {
        input.value = barcode;
        handleBarcodeScanTrigger();
    }
}

function quickAddAccessory(slug) {
    const p = posProducts.find(item => item.slug === slug);
    if (p) {
        addPosItem(p.id);
        showToast(`Added add-on: ${p.name}`, 'success');
    }
}

// Virtual Cart Actions
function addPosItem(productId, preselectedImei = null) {
    const product = posProducts.find(p => p.id === productId);
    if (!product || product.current_stock <= 0) {
        showToast('Product out of stock', 'error');
        return;
    }

    const existing = posCart.find(it => it.product.id === productId);
    if (existing) {
        if (existing.quantity >= product.current_stock) {
            showToast(`Only ${product.current_stock} units available in stock`, 'warning');
            return;
        }
        existing.quantity += 1;
        if (preselectedImei && !existing.selected_imeis.includes(preselectedImei)) {
            existing.selected_imeis.push(preselectedImei);
        }
    } else {
        const initialImeis = preselectedImei ? [preselectedImei] : (product.available_imeis && product.available_imeis.length > 0 ? [product.available_imeis[0]] : []);
        posCart.push({
            product: product,
            quantity: 1,
            unit_price: parseFloat(product.effective_price),
            selected_imeis: initialImeis
        });
    }

    renderPosCart();
}

function updatePosCartQty(index, delta) {
    const item = posCart[index];
    if (!item) return;

    item.quantity += delta;
    if (item.quantity <= 0) {
        posCart.splice(index, 1);
    } else if (item.quantity > item.product.current_stock) {
        item.quantity = item.product.current_stock;
        showToast(`Stock limit reached (${item.product.current_stock})`, 'warning');
    } else {
        if (item.product.requires_imei) {
            const available = item.product.available_imeis || [];
            item.selected_imeis = available.slice(0, item.quantity);
        }
    }

    renderPosCart();
}

function removePosCartItem(index) {
    posCart.splice(index, 1);
    renderPosCart();
}

function clearPosCart() {
    posCart = [];
    renderPosCart();
}

function renderPosCart() {
    const container = document.getElementById('pos-cart-items');
    if (!container) return;

    if (posCart.length === 0) {
        container.innerHTML = `
            <div class="h-full flex flex-col items-center justify-center text-slate-500 text-xs text-center p-4">
                <i data-lucide="scan-barcode" class="w-12 h-12 text-slate-700 mb-2 stroke-1"></i>
                <p class="font-semibold text-slate-400">Virtual Cart is Empty</p>
                <p class="text-[11px] text-slate-500 mt-0.5">Scan a barcode or click any product tile.</p>
            </div>
        `;
        lucide.createIcons();
        updatePosCartTotals();
        return;
    }

    container.innerHTML = posCart.map((it, idx) => {
        const itemTotal = (it.unit_price * it.quantity).toFixed(2);
        const hasImei = it.product.requires_imei;

        return `
            <div class="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col gap-1.5 text-xs">
                <div class="flex items-start justify-between gap-2">
                    <div class="min-w-0 flex-1">
                        <h5 class="font-bold text-white text-xs truncate">${it.product.name}</h5>
                        <div class="text-[11px] font-mono text-cyan-400 font-bold">$${it.unit_price.toFixed(2)} ea</div>
                    </div>
                    <button onclick="removePosCartItem(${idx})" class="text-slate-500 hover:text-rose-400 p-0.5">
                        <i data-lucide="trash-2" class="w-3.5 h-3.5"></i>
                    </button>
                </div>

                ${hasImei ? `
                    <div class="flex items-center justify-between bg-slate-900/80 px-2 py-1 rounded-lg border border-slate-800 text-[10px] font-mono">
                        <span class="text-slate-400 flex items-center gap-1">
                            <i data-lucide="smartphone" class="w-3 h-3 text-cyan-400"></i>
                            <span>IMEI:</span>
                            <span class="text-amber-300 font-bold">${it.selected_imeis.join(', ') || 'Auto-Assigned'}</span>
                        </span>
                        <button onclick="openImeiModal(${idx})" class="text-cyan-400 hover:underline font-bold">Select</button>
                    </div>
                ` : ''}

                <div class="flex items-center justify-between pt-1 border-t border-slate-900">
                    <div class="flex items-center gap-1.5 bg-slate-900 border border-slate-700 rounded-lg p-0.5">
                        <button onclick="updatePosCartQty(${idx}, -1)" class="w-5 h-5 rounded flex items-center justify-center text-slate-300 hover:bg-slate-800 font-bold">-</button>
                        <span class="text-xs font-mono font-bold px-1.5 text-white">${it.quantity}</span>
                        <button onclick="updatePosCartQty(${idx}, 1)" class="w-5 h-5 rounded flex items-center justify-center text-slate-300 hover:bg-slate-800 font-bold">+</button>
                    </div>
                    <span class="font-mono font-bold text-white text-xs">$${itemTotal}</span>
                </div>
            </div>
        `;
    }).join('');

    lucide.createIcons();
    updatePosCartTotals();
}

function updatePosCartTotals() {
    let subtotal = 0;
    posCart.forEach(it => {
        subtotal += it.unit_price * it.quantity;
    });

    const discountInput = document.getElementById('pos-discount-input');
    const discountVal = discountInput ? parseFloat(discountInput.value) || 0 : 0;
    const finalTotal = Math.max(0, subtotal - discountVal);
    const khrTotal = Math.round(finalTotal * 4100);

    const subtotalEl = document.getElementById('pos-subtotal');
    const finalTotalEl = document.getElementById('pos-final-total');
    const khrTotalEl = document.getElementById('pos-khr-total');

    if (subtotalEl) subtotalEl.innerText = `$${subtotal.toFixed(2)}`;
    if (finalTotalEl) finalTotalEl.innerText = `$${finalTotal.toFixed(2)}`;
    if (khrTotalEl) khrTotalEl.innerText = `${khrTotal.toLocaleString()} ៛`;
}

function applyPresetDiscount(amount) {
    const discountInput = document.getElementById('pos-discount-input');
    if (discountInput) {
        discountInput.value = amount;
        updatePosCartTotals();
    }
}

// IMEI Selection Modal
function openImeiModal(cartIndex) {
    activeImeiSelectionIndex = cartIndex;
    const item = posCart[cartIndex];
    if (!item) return;

    const modal = document.getElementById('pos-imei-modal');
    const nameEl = document.getElementById('imei-modal-product-name');
    const listEl = document.getElementById('imei-modal-list');

    if (nameEl) nameEl.innerText = `${item.product.name} (Qty: ${item.quantity})`;
    
    const availableImeis = item.product.available_imeis || [];
    if (listEl) {
        listEl.innerHTML = availableImeis.map(im => {
            const isChecked = item.selected_imeis.includes(im);
            return `
                <label class="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-cyan-400 cursor-pointer">
                    <span class="text-slate-200 font-mono">${im}</span>
                    <input type="checkbox" value="${im}" ${isChecked ? 'checked' : ''} class="imei-checkbox rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-0">
                </label>
            `;
        }).join('');
    }

    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }
}

function closeImeiModal() {
    const modal = document.getElementById('pos-imei-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}

function confirmImeiSelection() {
    if (activeImeiSelectionIndex === null) return;
    const item = posCart[activeImeiSelectionIndex];
    if (!item) return;

    const checkedBoxes = Array.from(document.querySelectorAll('.imei-checkbox:checked')).map(cb => cb.value);
    if (checkedBoxes.length > item.quantity) {
        showToast(`You selected ${checkedBoxes.length} IMEIs, but quantity is ${item.quantity}`, 'warning');
        return;
    }

    item.selected_imeis = checkedBoxes;
    closeImeiModal();
    renderPosCart();
}

// Payment Modal & Dynamic Bakong KHQR
async function openPaymentModal() {
    if (posCart.length === 0) {
        showToast('Cart is empty. Please scan an item first.', 'warning');
        return;
    }

    const modal = document.getElementById('pos-payment-modal');
    const payableEl = document.getElementById('modal-payable-amount');

    let subtotal = posCart.reduce((sum, it) => sum + (it.unit_price * it.quantity), 0);
    let discount = parseFloat(document.getElementById('pos-discount-input')?.value || 0);
    let total = Math.max(0, subtotal - discount);

    if (payableEl) payableEl.innerText = `$${total.toFixed(2)}`;

    const cashInput = document.getElementById('pos-cash-received');
    if (cashInput) cashInput.value = total.toFixed(2);
    updateChangeCalculation();

    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }

    // Default to Cash tab initially or keep current
    setPosPaymentMethod(currentPaymentMethod);
}

function closePaymentModal() {
    const modal = document.getElementById('pos-payment-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
    stopKhqrPolling();
}

function setPosPaymentMethod(method) {
    currentPaymentMethod = method;

    ['cash', 'aba', 'card'].forEach(m => {
        const btn = document.getElementById(`tab-btn-${m}`);
        const panel = document.getElementById(`pay-panel-${m}`);
        if (btn) {
            btn.className = `py-2.5 rounded-xl font-semibold flex flex-col items-center gap-1 border border-slate-800 bg-slate-900 text-slate-300 hover:text-white transition-all`;
        }
        if (panel) panel.classList.add('hidden');
    });

    const activeBtn = document.getElementById(`tab-btn-${method.toLowerCase().replace('_pay', '')}`);
    const activePanel = document.getElementById(`pay-panel-${method.toLowerCase().replace('_pay', '')}`);

    if (activeBtn) {
        activeBtn.className = `py-2.5 rounded-xl font-bold flex flex-col items-center gap-1 border bg-blue-600/30 border-blue-500 text-white transition-all`;
    }
    if (activePanel) activePanel.classList.remove('hidden');

    const completeBtn = document.getElementById('pos-complete-sale-btn');

    if (method === 'ABA_PAY') {
        if (completeBtn) completeBtn.classList.add('hidden'); // Automatic approval upon customer scan
        generatePosBakongKHQR();
    } else {
        if (completeBtn) completeBtn.classList.remove('hidden');
        stopKhqrPolling();
    }
}

// Generate Real Bakong KHQR for POS
async function generatePosBakongKHQR() {
    const imgEl = document.getElementById('pos-khqr-img');
    const loadingEl = document.getElementById('pos-khqr-loading');
    const amountUsdEl = document.getElementById('pos-aba-amount');
    const amountKhrEl = document.getElementById('pos-aba-khr-amount');
    const mobileLink = document.getElementById('pos-mobile-scan-link');

    if (loadingEl) loadingEl.classList.remove('hidden');

    let subtotal = posCart.reduce((sum, it) => sum + (it.unit_price * it.quantity), 0);
    let discount = parseFloat(document.getElementById('pos-discount-input')?.value || 0);
    let total = Math.max(0, subtotal - discount);

    // Pre-create POS order in PENDING status
    try {
        const preCheckoutPayload = {
            customer_name: 'In-Store Walk-in',
            discount_amount: discount,
            payment_method: 'ABA_PAY',
            payment_status: 'PENDING',
            cashier_name: 'Bopha (Station 01)',
            items: posCart.map(it => ({
                product_id: it.product.id,
                quantity: it.quantity,
                unit_price: it.unit_price,
                selected_imeis: it.selected_imeis
            }))
        };

        const checkoutRes = await fetch('/api/pos/checkout/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(preCheckoutPayload)
        });

        const checkoutData = await checkoutRes.json();
        if (!checkoutRes.ok) throw new Error(checkoutData.error || 'Failed to initialize POS KHQR transaction');

        currentPosOrderNumber = checkoutData.order_number;

        // Fetch authentic Bakong KHQR image & string
        const khqrRes = await fetch('/api/payment/khqr/generate/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                order_number: currentPosOrderNumber,
                amount: total,
                currency: 'USD'
            })
        });

        const khqrData = await khqrRes.json();
        if (!khqrRes.ok) throw new Error('Failed to generate KHQR');

        if (imgEl) imgEl.src = khqrData.qr_image_base64;
        if (amountUsdEl) amountUsdEl.innerText = `$${parseFloat(khqrData.amount_usd).toFixed(2)}`;
        if (amountKhrEl) amountKhrEl.innerText = `≈ ${khqrData.amount_khr} KHR`;
        if (mobileLink) mobileLink.href = khqrData.mobile_pay_url;

        if (loadingEl) loadingEl.classList.add('hidden');

        // Start countdown timer and live polling for payment verification
        startKhqrPolling(currentPosOrderNumber);

    } catch (e) {
        showToast(e.message, 'error');
        if (loadingEl) loadingEl.classList.add('hidden');
    }
}

function startKhqrPolling(orderNumber) {
    stopKhqrPolling();

    khqrSecondsLeft = 180;
    const timerEl = document.getElementById('pos-khqr-timer');
    if (timerEl) timerEl.innerText = '03:00';

    khqrTimerInterval = setInterval(() => {
        khqrSecondsLeft--;
        if (khqrSecondsLeft <= 0) {
            stopKhqrPolling();
            if (timerEl) timerEl.innerText = 'Expired';
            showToast('KHQR expired. Please generate a new code.', 'warning');
            return;
        }
        const mins = String(Math.floor(khqrSecondsLeft / 60)).padStart(2, '0');
        const secs = String(khqrSecondsLeft % 60).padStart(2, '0');
        if (timerEl) timerEl.innerText = `${mins}:${secs}`;
    }, 1000);

    // Poll status every 1.5s
    khqrPollInterval = setInterval(async () => {
        try {
            const res = await fetch(`/api/payment/khqr/status/${orderNumber}/`);
            if (res.ok) {
                const data = await res.json();
                if (data.payment_status === 'PAID') {
                    stopKhqrPolling();
                    closePaymentModal();
                    clearPosCart();
                    showToast(`✅ ABA Pay KHQR Verified! Order #${orderNumber}`, 'success');

                    // Play chime sound
                    const sound = document.getElementById('order-alert-sound');
                    if (sound) sound.play().catch(() => {});

                    if (data.receipt_data) {
                        openReceiptModal(data.receipt_data);
                    }
                }
            }
        } catch (e) {
            // Ignore polling errors
        }
    }, 1500);
}

function stopKhqrPolling() {
    if (khqrPollInterval) clearInterval(khqrPollInterval);
    if (khqrTimerInterval) clearInterval(khqrTimerInterval);
    khqrPollInterval = null;
    khqrTimerInterval = null;
}

function setCashReceived(amt) {
    const cashInput = document.getElementById('pos-cash-received');
    if (cashInput) {
        cashInput.value = amt.toFixed(2);
        updateChangeCalculation();
    }
}

function setCashReceivedExact() {
    let subtotal = posCart.reduce((sum, it) => sum + (it.unit_price * it.quantity), 0);
    let discount = parseFloat(document.getElementById('pos-discount-input')?.value || 0);
    let total = Math.max(0, subtotal - discount);
    setCashReceived(total);
}

function updateChangeCalculation() {
    let subtotal = posCart.reduce((sum, it) => sum + (it.unit_price * it.quantity), 0);
    let discount = parseFloat(document.getElementById('pos-discount-input')?.value || 0);
    let total = Math.max(0, subtotal - discount);

    const cashInput = document.getElementById('pos-cash-received');
    const received = cashInput ? parseFloat(cashInput.value) || 0 : 0;
    const changeUsd = Math.max(0, received - total);
    const changeKhr = Math.round(changeUsd * 4100);

    const usdEl = document.getElementById('pos-change-usd');
    const khrEl = document.getElementById('pos-change-khr');

    if (usdEl) usdEl.innerText = `$${changeUsd.toFixed(2)}`;
    if (khrEl) khrEl.innerText = `${changeKhr.toLocaleString()} ៛`;
}

// Execute POS Sale (For Cash & Card)
async function submitPosSale() {
    const btn = document.getElementById('pos-complete-sale-btn');
    if (btn) btn.disabled = true;

    let subtotal = posCart.reduce((sum, it) => sum + (it.unit_price * it.quantity), 0);
    let discount = parseFloat(document.getElementById('pos-discount-input')?.value || 0);
    let total = Math.max(0, subtotal - discount);
    let cashReceived = parseFloat(document.getElementById('pos-cash-received')?.value || total);

    const payload = {
        customer_name: 'Walk-in Customer',
        discount_amount: discount,
        payment_method: currentPaymentMethod,
        cash_received: cashReceived,
        cashier_name: 'Bopha (Station 01)',
        items: posCart.map(it => ({
            product_id: it.product.id,
            quantity: it.quantity,
            unit_price: it.unit_price,
            selected_imeis: it.selected_imeis
        }))
    };

    try {
        const res = await fetch('/api/pos/checkout/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'POS checkout failed');

        lastReceiptData = data.receipt_data;
        closePaymentModal();
        clearPosCart();
        showToast(`Transaction ${data.order_number} Completed!`, 'success');
        openReceiptModal(data.receipt_data);
    } catch (err) {
        showToast(err.message, 'error');
    } finally {
        if (btn) btn.disabled = false;
    }
}

// Thermal Receipt Modal & Printing
function openReceiptModal(receipt) {
    const modal = document.getElementById('thermal-receipt-modal');
    const printable = document.getElementById('thermal-receipt-printable');
    if (!modal || !printable || !receipt) return;

    const items = receipt.items || [];
    const dateStr = new Date(receipt.created_at).toLocaleString('en-US', { timeZone: 'Asia/Phnom_Penh' });

    printable.innerHTML = `
        <div class="text-center space-y-1 border-b border-dashed border-slate-300 pb-3">
            <h2 class="font-extrabold text-base tracking-wider">BLUE COMPUTER</h2>
            <p class="text-[10px] text-slate-600">Phnom Penh Flagship Tech Retail</p>
            <p class="text-[10px] text-slate-600">#42 St. 310, BKK1, Phnom Penh</p>
            <p class="text-[10px] text-slate-600">Tel: +855 12 888 999 • bluecomputer.com</p>
        </div>

        <div class="text-[10px] space-y-0.5 border-b border-dashed border-slate-300 py-2">
            <div class="flex justify-between"><span>Receipt No:</span><span class="font-bold">${receipt.order_number}</span></div>
            <div class="flex justify-between"><span>Date/Time:</span><span>${dateStr}</span></div>
            <div class="flex justify-between"><span>Cashier:</span><span>${receipt.cashier_name}</span></div>
            <div class="flex justify-between"><span>Payment:</span><span class="font-bold">${receipt.payment_method}</span></div>
        </div>

        <div class="py-2 border-b border-dashed border-slate-300 text-[10px] space-y-2">
            ${items.map(it => `
                <div>
                    <div class="flex justify-between font-semibold">
                        <span>${it.quantity}x ${it.product_name}</span>
                        <span>$${parseFloat(it.total_price).toFixed(2)}</span>
                    </div>
                    ${it.imeis_json && it.imeis_json.length > 0 ? `
                        <div class="text-[9px] text-slate-600 pl-2">
                            IMEI: ${it.imeis_json.join(', ')}
                        </div>
                    ` : ''}
                </div>
            `).join('')}
        </div>

        <div class="text-[10px] space-y-1 border-b border-dashed border-slate-300 py-2 font-mono">
            <div class="flex justify-between"><span>Subtotal:</span><span>$${parseFloat(receipt.subtotal).toFixed(2)}</span></div>
            ${parseFloat(receipt.discount_amount) > 0 ? `
                <div class="flex justify-between text-rose-600"><span>Discount:</span><span>-$${parseFloat(receipt.discount_amount).toFixed(2)}</span></div>
            ` : ''}
            <div class="flex justify-between font-extrabold text-xs pt-1 border-t border-slate-200">
                <span>TOTAL PAYABLE:</span>
                <span>$${parseFloat(receipt.total_amount).toFixed(2)}</span>
            </div>
            <div class="flex justify-between text-[9px] text-slate-600">
                <span>Total in KHR (~4,100):</span>
                <span>${(Math.round(parseFloat(receipt.total_amount) * 4100)).toLocaleString()} ៛</span>
            </div>
            ${receipt.payment_method === 'CASH' ? `
                <div class="flex justify-between text-[9px] pt-1"><span>Cash Tendered:</span><span>$${parseFloat(receipt.cash_received).toFixed(2)}</span></div>
                <div class="flex justify-between text-[9px]"><span>Change Returned:</span><span>$${parseFloat(receipt.change_returned).toFixed(2)}</span></div>
            ` : ''}
        </div>

        <div class="text-center space-y-1 pt-2">
            <p class="text-[9px] font-bold">1 Year Official Warranty • Keep Receipt for RMA</p>
            <div class="w-16 h-16 mx-auto bg-slate-100 p-1 border border-slate-200 rounded">
                <img src="https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${receipt.order_number}" class="w-full h-full">
            </div>
            <p class="text-[8px] text-slate-500">Thank you for choosing Blue Computer!</p>
        </div>
    `;

    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function closeReceiptModal() {
    const modal = document.getElementById('thermal-receipt-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}

// Shift Ledger Modal
async function openShiftLedgerModal() {
    const modal = document.getElementById('shift-ledger-modal');
    const content = document.getElementById('ledger-modal-content');
    if (!modal || !content) return;

    modal.classList.remove('hidden');
    modal.classList.add('flex');

    content.innerHTML = `<div class="py-8 text-center"><i data-lucide="loader-2" class="w-6 h-6 animate-spin mx-auto text-cyan-400"></i></div>`;
    lucide.createIcons();

    try {
        const res = await fetch('/api/pos/ledger-summary/');
        if (!res.ok) throw new Error('Failed');
        const data = await res.json();
        const l = data.ledger;

        content.innerHTML = `
            <div class="grid grid-cols-2 gap-2 text-center">
                <div class="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <span class="text-slate-400 block text-[10px]">Today's Total Sales:</span>
                    <span class="text-lg font-black text-cyan-400 font-mono">$${parseFloat(l.total_revenue).toFixed(2)}</span>
                </div>
                <div class="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <span class="text-slate-400 block text-[10px]">Gross Profit:</span>
                    <span class="text-lg font-black text-emerald-400 font-mono">$${parseFloat(l.total_profit).toFixed(2)}</span>
                </div>
            </div>

            <div class="space-y-1.5 p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono">
                <div class="flex justify-between"><span>Opening Cash Drawer:</span><span class="text-slate-200">$${parseFloat(l.opening_cash).toFixed(2)}</span></div>
                <div class="flex justify-between text-emerald-400"><span>+ Cash Sales:</span><span>$${parseFloat(l.cash_sales).toFixed(2)}</span></div>
                <div class="flex justify-between text-rose-400"><span>+ ABA Pay KHQR:</span><span>$${parseFloat(l.aba_sales).toFixed(2)}</span></div>
                <div class="flex justify-between text-blue-400"><span>+ Card Sales:</span><span>$${parseFloat(l.card_sales).toFixed(2)}</span></div>
                <div class="flex justify-between text-purple-400"><span>+ Online Orders:</span><span>$${parseFloat(l.online_sales).toFixed(2)}</span></div>
                <div class="flex justify-between font-bold text-white pt-2 border-t border-slate-800">
                    <span>Expected Cash in Drawer:</span>
                    <span>$${parseFloat(data.expected_drawer_cash).toFixed(2)}</span>
                </div>
            </div>
        `;
    } catch (e) {
        content.innerHTML = `<p class="text-rose-400 text-center py-4">Error loading shift ledger.</p>`;
    }
}

function closeShiftLedgerModal() {
    const modal = document.getElementById('shift-ledger-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}

// In-Store Online Fulfillment System
function toggleFulfillmentDrawer() {
    const drawer = document.getElementById('fulfillment-drawer');
    if (drawer) {
        drawer.classList.toggle('translate-x-full');
        if (!drawer.classList.contains('translate-x-full')) {
            loadFulfillmentOrders();
        }
    }
}

async function loadFulfillmentOrders() {
    const list = document.getElementById('fulfillment-orders-list');
    const badge = document.getElementById('pos-online-order-count');

    try {
        const res = await fetch('/api/ecommerce/orders/online/');
        if (!res.ok) return;
        const orders = await res.json();

        const pendingOrders = orders.filter(o => o.fulfillment_status === 'PENDING' || o.fulfillment_status === 'PACKING');
        if (badge) badge.innerText = pendingOrders.length;

        if (!list) return;

        if (orders.length === 0) {
            list.innerHTML = `<div class="py-12 text-center text-slate-500 text-xs">No online orders at this time.</div>`;
            return;
        }

        list.innerHTML = orders.map(o => `
            <div class="p-4 rounded-2xl bg-slate-950 border ${o.fulfillment_status === 'PENDING' ? 'border-amber-500/50 bg-amber-950/10' : 'border-slate-800'} space-y-2 text-xs">
                <div class="flex items-center justify-between">
                    <span class="font-mono font-bold text-cyan-400">${o.order_number}</span>
                    <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${o.fulfillment_status === 'PENDING' ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'}">
                        ${o.fulfillment_status}
                    </span>
                </div>

                <div class="space-y-0.5 text-slate-300">
                    <p class="font-semibold text-white">${o.customer_name} • <span class="text-cyan-300">${o.customer_phone}</span></p>
                    <p class="text-slate-400 text-[11px]">${o.delivery_district}, ${o.delivery_address}</p>
                </div>

                <div class="py-1 border-t border-slate-900 text-[11px] text-slate-400">
                    ${(o.items || []).map(it => `<div>• ${it.quantity}x ${it.product_name}</div>`).join('')}
                </div>

                <div class="flex items-center justify-between pt-1 font-mono">
                    <span class="font-bold text-white">$${parseFloat(o.total_amount).toFixed(2)} (${o.payment_method})</span>
                    ${o.fulfillment_status === 'PENDING' ? `
                        <button onclick="fulfillOrder(${o.id}, 'PACKING')" class="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs">
                            Start Packing
                        </button>
                    ` : o.fulfillment_status === 'PACKING' ? `
                        <button onclick="fulfillOrder(${o.id}, 'OUT_FOR_DELIVERY')" class="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs">
                            Dispatch Rider
                        </button>
                    ` : `
                        <span class="text-slate-500 text-[11px]">Dispatched</span>
                    `}
                </div>
            </div>
        `).join('');

    } catch (e) {
        console.error("Fulfillment load error", e);
    }
}

async function fulfillOrder(orderId, nextStatus) {
    try {
        const res = await fetch(`/api/ecommerce/orders/${orderId}/fulfill/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: nextStatus })
        });
        if (res.ok) {
            showToast(`Order marked as ${nextStatus}!`, 'success');
            loadFulfillmentOrders();
        }
    } catch (e) {
        showToast('Failed to update status', 'error');
    }
}
