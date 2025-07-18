import { auth } from './firebase-config.js';
import { signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

function initializeSidebar() {
    // --- Lógica del Tema (Claro/Oscuro) ---
    const themeToggleButton = document.getElementById('theme-toggle-btn');
    if (themeToggleButton) {
        const themeIcon = themeToggleButton.querySelector('.material-symbols-outlined');
        const applyTheme = (theme) => {
            document.documentElement.setAttribute('data-theme', theme);
            localStorage.setItem('theme', theme);
            if (themeIcon) {
                themeIcon.textContent = theme === 'dark' ? 'light_mode' : 'dark_mode';
            }
        };

        themeToggleButton.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
            applyTheme(currentTheme === 'dark' ? 'light' : 'dark');
        });

        const savedTheme = localStorage.getItem('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        applyTheme(savedTheme || (prefersDark ? 'dark' : 'light'));
    }

    // --- Lógica del Menú y Usuario ---
    const userEmailDisplay = document.getElementById('user-email-display-sidebar');
    const logoutBtn = document.getElementById('user-logout-btn-sidebar');

    if (auth.currentUser && userEmailDisplay) {
        userEmailDisplay.textContent = auth.currentUser.email;
    }
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => signOut(auth));
    }

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
    } catch (error) {
        console.error("Failed to load sidebar:", error);
    }
}
