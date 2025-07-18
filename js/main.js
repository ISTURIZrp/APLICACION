// js/main.js

function initializeSidebar() {
    // --- Lógica del Tema (Claro/Oscuro) ---
    const themeToggleButton = document.getElementById('theme-toggle-btn');
    const themeIcon = themeToggleButton.querySelector('.material-symbols-outlined');

    const applyTheme = (theme) => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        themeIcon.textContent = theme === 'dark' ? 'light_mode' : 'dark_mode';
    };

    themeToggleButton.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        applyTheme(newTheme);
    });

    // Carga el tema guardado o el preferido por el sistema al iniciar
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    applyTheme(savedTheme || (prefersDark ? 'dark' : 'light'));

    // --- Lógica del Menú y Usuario ---
    const currentPage = window.location.pathname.split("/").pop() || "index.html";
    document.querySelectorAll('#sidebar a').forEach(link => {
        if (link.getAttribute('href') === currentPage) {
            link.classList.add('active');
        }
    });
}
