/**
 * Displays a toast notification.
 * @param {string} message The message to display.
 * @param {'success' | 'error'} type The type of toast (success or error).
 */
function showToast(message, type = 'success') {
    const container = document.getElementById('toast-container');
    if (!container) {
        console.error('Toast container not found!');
        return;
    }

    const toast = document.createElement('div');
    
    // Determine color and icon based on type
    const bgColor = type === 'success' ? 'bg-green-500' : 'bg-red-500';
    const icon = type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle';
    
    // Apply Tailwind classes for styling
    toast.className = `max-w-sm w-full ${bgColor} text-white px-6 py-4 rounded-lg shadow-lg flex items-center space-x-3 transform transition-all duration-300 translate-x-0 opacity-100 mb-2`;
    toast.innerHTML = `
        <i class="fas ${icon}"></i>
        <span>${message}</span>
    `;
    
    // Add to the top of the container
    container.prepend(toast);
    
    // Animate out after 3 seconds
    setTimeout(() => {
        toast.style.transform = 'translateX(400px)'; // Slide out
        toast.style.opacity = '0';
        // Remove from DOM after animation finishes
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Make the function globally available
window.showToast = showToast;