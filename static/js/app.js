/** Sidebar toggle for mobile */
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    if (!sidebar) return;
    sidebar.classList.toggle('-translate-x-full');
    overlay?.classList.toggle('hidden');
}

/** Generic table search filter */
function filterTableRows(inputId, tbodyId, fields) {
    const input = document.getElementById(inputId);
    const tbody = document.getElementById(tbodyId);
    if (!input || !tbody) return;

    input.addEventListener('input', () => {
        const term = input.value.toLowerCase();
        tbody.querySelectorAll('tr[data-search]').forEach(row => {
            const text = fields.map(f => String(row.dataset[f] || '')).join(' ').toLowerCase();
            row.classList.toggle('hidden', term && !text.includes(term));
        });
    });
}

/** Modal helpers */
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    const content = modal?.querySelector('[data-modal-content]');
    modal?.classList.remove('hidden');
    requestAnimationFrame(() => {
        content?.classList.remove('scale-95', 'opacity-0');
    });
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    const content = modal?.querySelector('[data-modal-content]');
    content?.classList.add('scale-95', 'opacity-0');
    setTimeout(() => modal?.classList.add('hidden'), 200);
}

/** API helper with error toast */
async function apiFetch(url, options = {}) {
    const res = await fetch(url, {
        headers: { 'Content-Type': 'application/json', ...options.headers },
        ...options,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        throw new Error(data.error || data.message || `Request failed (${res.status})`);
    }
    return data;
}

/** Status badge HTML */
function statusBadge(status, type = 'default') {
    const colors = {
        active: 'bg-emerald-100 text-emerald-800',
        inactive: 'bg-slate-100 text-slate-600',
        pending: 'bg-amber-100 text-amber-800',
        confirmed: 'bg-blue-100 text-blue-800',
        shipped: 'bg-indigo-100 text-indigo-800',
        delivered: 'bg-emerald-100 text-emerald-800',
        cancelled: 'bg-red-100 text-red-800',
        completed: 'bg-emerald-100 text-emerald-800',
        'LOW STOCK': 'bg-amber-100 text-amber-800',
        'OUT OF STOCK': 'bg-red-100 text-red-800',
        'IN STOCK': 'bg-emerald-100 text-emerald-800',
    };
    const cls = colors[status] || 'bg-slate-100 text-slate-700';
    return `<span class="inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold ${cls}">${status || '—'}</span>`;
}

/** Format currency */
function formatCurrency(val) {
    return '₹' + Number(val || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/** Disable write actions for viewers */
document.addEventListener('DOMContentLoaded', () => {
    if (window.CAN_WRITE === false) {
        document.querySelectorAll('[data-write-only]').forEach(el => el.classList.add('hidden'));
    }
});
