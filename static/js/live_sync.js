// Blue Computer Real-Time Event Sync Engine
(function () {
    let lastEventId = 0;
    let isPolling = false;
    let pendingOnlineOrdersCount = 0;

    // Load initial online orders count
    async function checkPendingOrders() {
        try {
            const res = await fetch('/api/ecommerce/orders/online/?status=PENDING');
            if (res.ok) {
                const orders = await res.json();
                pendingOnlineOrdersCount = orders.length;
                updateFulfillmentBadge();
            }
        } catch (e) {
            console.error("Failed to fetch pending orders count", e);
        }
    }

    function updateFulfillmentBadge() {
        const badge = document.getElementById('pos-fulfillment-badge');
        if (badge) {
            if (pendingOnlineOrdersCount > 0) {
                badge.innerText = pendingOnlineOrdersCount;
                badge.classList.remove('hidden');
            } else {
                badge.classList.add('hidden');
            }
        }
    }

    async function pollSyncEvents() {
        if (isPolling) return;
        isPolling = true;

        try {
            const res = await fetch(`/api/sync/events/?since_id=${lastEventId}`);
            if (res.ok) {
                const events = await res.json();
                if (events && events.length > 0) {
                    events.forEach(ev => {
                        if (ev.id > lastEventId) lastEventId = ev.id;
                        handleEvent(ev);
                    });
                }
            }
        } catch (err) {
            // Silently retry on next tick
        } finally {
            isPolling = false;
        }
    }

    function handleEvent(ev) {
        const { event_type, payload } = ev;

        if (event_type === 'NEW_ONLINE_ORDER') {
            pendingOnlineOrdersCount++;
            updateFulfillmentBadge();

            // Play chime sound
            const sound = document.getElementById('order-alert-sound');
            if (sound) {
                sound.play().catch(() => {}); // Audio play may require user gesture
            }

            if (typeof showToast === 'function') {
                showToast(`🚀 New Online Order #${payload.order_number} received from ${payload.delivery_district || 'Phnom Penh'} ($${payload.total_amount})!`, 'info');
            }

            window.dispatchEvent(new CustomEvent('new_online_order', { detail: payload }));
            window.dispatchEvent(new CustomEvent('inventory_updated', { detail: payload }));
        }
        else if (event_type === 'STOCK_UPDATE' || event_type === 'POS_SALE') {
            window.dispatchEvent(new CustomEvent('inventory_updated', { detail: payload }));
        }
        else if (event_type === 'ORDER_STATUS_CHANGE') {
            checkPendingOrders();
            window.dispatchEvent(new CustomEvent('order_status_changed', { detail: payload }));
        }
    }

    // Initialize sync loop
    document.addEventListener('DOMContentLoaded', () => {
        checkPendingOrders();
        setInterval(pollSyncEvents, 1500);
    });

    window.OmniSync = {
        checkPendingOrders,
        decrementPendingCount: () => {
            if (pendingOnlineOrdersCount > 0) {
                pendingOnlineOrdersCount--;
                updateFulfillmentBadge();
            }
        }
    };
})();
