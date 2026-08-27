// Blue Computer Admin & Inventory Manager
let adminProducts = [];
let activeDrawerProductId = null;

document.addEventListener('DOMContentLoaded', () => {
    loadDashboardStats();
    loadInventoryTable();
    setupAdminListeners();

    window.addEventListener('inventory_updated', () => {
        loadDashboardStats();
        loadInventoryTable(false);
    });
});

function setupAdminListeners() {
    const searchInput = document.getElementById('admin-search-input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            const filtered = adminProducts.filter(p => 
                p.name.toLowerCase().includes(term) ||
                p.sku.toLowerCase().includes(term) ||
                p.barcode.toLowerCase().includes(term) ||
                p.brand_name.toLowerCase().includes(term)
            );
            renderInventoryTable(filtered);
        });
    }

    const form = document.getElementById('add-product-form');
    if (form) {
        form.addEventListener('submit', handleAddProductSubmit);
    }
}

async function loadDashboardStats() {
    try {
        const res = await fetch('/api/admin/dashboard-stats/');
        if (!res.ok) return;
        const stats = await res.json();

        document.getElementById('kpi-total-units').innerText = stats.total_units_in_stock;
        document.getElementById('kpi-total-products').innerText = `across ${stats.total_products} models`;
        document.getElementById('kpi-wholesale-value').innerText = `$${parseFloat(stats.total_wholesale_value).toFixed(2)}`;
        document.getElementById('kpi-retail-value').innerText = `$${parseFloat(stats.total_retail_value).toFixed(2)}`;
        document.getElementById('kpi-potential-profit').innerText = `+$${parseFloat(stats.potential_gross_profit).toFixed(2)} potential profit`;
        document.getElementById('kpi-today-sales').innerText = `$${parseFloat(stats.today_sales).toFixed(2)}`;
        document.getElementById('kpi-today-orders').innerText = `${stats.today_order_count} orders today`;
    } catch (e) {
        console.error("Stats load error", e);
    }
}

async function loadInventoryTable(showLoading = true) {
    const tbody = document.getElementById('inventory-table-body');
    if (showLoading && tbody) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="py-12 text-center text-slate-500">
                    <i data-lucide="loader-2" class="w-6 h-6 animate-spin mx-auto text-cyan-400 mb-2"></i>
                    <span>Loading inventory records...</span>
                </td>
            </tr>
        `;
        lucide.createIcons();
    }

    try {
        const res = await fetch('/api/products/');
        if (!res.ok) throw new Error('Failed');
        adminProducts = await res.json();
        renderInventoryTable(adminProducts);
    } catch (e) {
        if (tbody) {
            tbody.innerHTML = `<tr><td colspan="8" class="py-8 text-center text-rose-400">Failed to load inventory.</td></tr>`;
        }
    }
}

function renderInventoryTable(products) {
    const tbody = document.getElementById('inventory-table-body');
    if (!tbody) return;

    if (products.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" class="py-8 text-center text-slate-500">No matching products found.</td></tr>`;
        return;
    }

    tbody.innerHTML = products.map(p => {
        const inStock = p.current_stock > 0;
        const margin = p.margin_percentage || 0;
        const wholesale = parseFloat(p.wholesale_price).toFixed(2);
        const retail = parseFloat(p.effective_price).toFixed(2);

        return `
            <tr class="hover:bg-slate-900/60 transition-colors">
                <td class="py-3.5 px-4">
                    <div class="flex items-center gap-3">
                        <img src="${p.image_url || 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=100'}" class="w-10 h-10 object-cover rounded-lg bg-slate-950 shrink-0">
                        <div>
                            <div class="font-bold text-white text-xs">${p.name}</div>
                            <span class="text-[10px] text-slate-400">${p.storage || ''} ${p.color || ''}</span>
                        </div>
                    </div>
                </td>
                <td class="py-3.5 px-4 font-medium text-slate-300">
                    <div>${p.brand_name}</div>
                    <span class="text-[10px] text-slate-500">${p.category_name}</span>
                </td>
                <td class="py-3.5 px-4 font-mono text-[11px] text-slate-400">
                    <div class="text-white">${p.sku}</div>
                    <span class="text-[10px] text-slate-500">${p.barcode}</span>
                </td>
                <td class="py-3.5 px-4 font-mono text-amber-300 font-semibold">$${wholesale}</td>
                <td class="py-3.5 px-4 font-mono text-cyan-300 font-bold">$${retail}</td>
                <td class="py-3.5 px-4 font-mono text-emerald-400 font-semibold">${margin}%</td>
                <td class="py-3.5 px-4">
                    <span class="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold ${inStock ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'}">
                        ${p.current_stock} Units
                    </span>
                </td>
                <td class="py-3.5 px-4 text-right">
                    ${p.requires_imei ? `
                        <button onclick="openImeiDrawer(${p.id})" class="px-2.5 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/40 text-blue-300 border border-blue-500/30 text-[11px] font-semibold flex items-center gap-1 ml-auto">
                            <i data-lucide="smartphone" class="w-3.5 h-3.5"></i>
                            <span>View IMEIs</span>
                        </button>
                    ` : `
                        <span class="text-slate-500 text-[11px] font-mono">Accessory</span>
                    `}
                </td>
            </tr>
        `;
    }).join('');

    lucide.createIcons();
}

// Add Product Modal
function openAddProductModal() {
    const modal = document.getElementById('add-product-modal');
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }
}

function closeAddProductModal() {
    const modal = document.getElementById('add-product-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}

async function handleAddProductSubmit(e) {
    e.preventDefault();
    const btn = document.getElementById('save-product-btn');
    if (btn) btn.disabled = true;

    const name = document.getElementById('prod-name').value;
    const brand_id = document.getElementById('prod-brand').value;
    const category_id = document.getElementById('prod-category').value;
    const sku = document.getElementById('prod-sku').value;
    const barcode = document.getElementById('prod-barcode').value;
    const wholesale_price = document.getElementById('prod-wholesale').value;
    const retail_price = document.getElementById('prod-retail').value;
    const discount_price = document.getElementById('prod-discount').value;
    const imeis = document.getElementById('prod-imeis').value;
    const image_url = document.getElementById('prod-image-url').value;

    const payload = {
        name,
        brand_id,
        category_id,
        sku,
        barcode,
        wholesale_price,
        retail_price,
        discount_price: discount_price || null,
        requires_imei: true,
        imeis,
        image_url: image_url || 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800'
    };

    try {
        const res = await fetch('/api/admin/products/manage/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to register product');

        showToast(data.message, 'success');
        closeAddProductModal();
        document.getElementById('add-product-form').reset();
        loadDashboardStats();
        loadInventoryTable();
    } catch (err) {
        showToast(err.message, 'error');
    } finally {
        if (btn) btn.disabled = false;
    }
}

// Product IMEI Drawer
async function openImeiDrawer(productId) {
    activeDrawerProductId = productId;
    const modal = document.getElementById('imei-drawer-modal');
    const titleEl = document.getElementById('drawer-product-title');
    const listEl = document.getElementById('drawer-imei-list');

    if (!modal || !listEl) return;

    modal.classList.remove('hidden');
    modal.classList.add('flex');

    listEl.innerHTML = `<div class="py-8 text-center"><i data-lucide="loader-2" class="w-6 h-6 animate-spin mx-auto text-cyan-400"></i></div>`;
    lucide.createIcons();

    try {
        const res = await fetch(`/api/products/${productId}/`);
        if (!res.ok) throw new Error('Not found');
        const product = await res.json();

        if (titleEl) titleEl.innerText = `${product.name} (Stock: ${product.current_stock})`;

        const imeis = product.imeis || [];
        if (imeis.length === 0) {
            listEl.innerHTML = `<div class="text-slate-500 text-center py-6">No IMEIs registered for this model yet.</div>`;
            return;
        }

        listEl.innerHTML = imeis.map(im => {
            const isAvailable = im.status === 'AVAILABLE';
            const badgeClass = isAvailable ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' : 'bg-slate-800 text-slate-500 border-slate-700';

            return `
                <div class="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                    <div>
                        <div class="text-amber-300 font-bold">${im.imei}</div>
                        <span class="text-[10px] text-slate-500">Recv: ${new Date(im.received_date).toLocaleDateString()}</span>
                    </div>
                    <span class="px-2 py-0.5 rounded-full text-[10px] border font-bold ${badgeClass}">
                        ${im.status}
                    </span>
                </div>
            `;
        }).join('');

    } catch (e) {
        listEl.innerHTML = `<div class="text-rose-400 text-center py-4">Error loading IMEIs.</div>`;
    }
}

function closeImeiDrawerModal() {
    const modal = document.getElementById('imei-drawer-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}

async function appendSingleImei() {
    if (!activeDrawerProductId) return;
    const input = document.getElementById('append-imei-input');
    if (!input || !input.value.trim()) return;

    const imei = input.value.trim();

    try {
        const res = await fetch(`/api/admin/products/${activeDrawerProductId}/receive-stock/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ imeis: imei })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to add IMEI');

        showToast(data.message, 'success');
        input.value = '';
        openImeiDrawer(activeDrawerProductId);
        loadDashboardStats();
        loadInventoryTable(false);
    } catch (err) {
        showToast(err.message, 'error');
    }
}
