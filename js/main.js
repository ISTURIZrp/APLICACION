import { auth } from './firebase-config.js';

function initializeSidebar() {
    const currentPage = window.location.pathname.split("/").pop() || "index.html";
    document.querySelectorAll('#sidebar a').forEach(link => {
        if (link.getAttribute('href') === currentPage) {
            link.classList.add('active');
        }
    });
}

export async function loadSidebar() {
    if (!document.getElementById('sidebar-container')) return;
    try {
        const response = await fetch('plantillas/sidebar.html');
        if (!response.ok) throw new Error('Sidebar not found');
        document.getElementById('sidebar-container').innerHTML = await response.text();
        initializeSidebar();
    } catch (error) { console.error("Failed to load sidebar:", error); }
}
