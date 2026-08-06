/**
 * Fetches and populates the statistics on the dashboard page.
 */
async function loadDashboardStats() {
    try {
        const response = await fetch('/api/dashboard-stats');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const stats = await response.json();
        
        if (stats.error) {
            console.error('Error loading dashboard stats:', stats.error);
            // Optionally show a toast to the user
            if (window.showToast) {
                window.showToast(`Failed to load stats: ${stats.error}`, 'error');
            }
            return;
        }
        
        // Populate the dashboard cards
        document.getElementById('suppliersCount').textContent = stats.suppliers || 0;
        document.getElementById('productsCount').textContent = stats.products || 0;
        document.getElementById('customersCount').textContent = stats.customers || 0;
        document.getElementById('ordersCount').textContent = stats.orders || 0;
        document.getElementById('warehousesCount').textContent = stats.warehouses || 0;
        document.getElementById('distributorsCount').textContent = stats.distributors || 0;

    } catch (error) {
        console.error('Failed to load dashboard stats:', error);
        if (window.showToast) {
            window.showToast('Failed to connect to statistics server.', 'error');
        }
    }
}

// Check if we are on the dashboard page by looking for a key element
if (document.getElementById('suppliersCount')) {
    loadDashboardStats();
    // Refresh stats every 30 seconds
    setInterval(loadDashboardStats, 30000);
}