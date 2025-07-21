// theme.js

const toggleModeButton = document.getElementById('toggle-mode');

// Verificar si hay un modo guardado en localStorage
const currentMode = localStorage.getItem('mode') || 'light';

// Aplicar el modo guardado al cargar la página
document.body.classList.toggle('dark-mode', currentMode === 'dark');
document.body.classList.toggle('light-mode', currentMode === 'light');

// Cambiar el texto del botón según el modo actual
toggleModeButton.textContent = currentMode === 'dark' ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro';

// Evento para cambiar de modo
toggleModeButton.addEventListener('click', () => {
    const isDarkMode = document.body.classList.toggle('dark-mode');
    document.body.classList.toggle('light-mode', !isDarkMode);

    // Guardar el modo actual en localStorage
    const newMode = isDarkMode ? 'dark' : 'light';
    localStorage.setItem('mode', newMode);

    // Cambiar el texto del botón
    toggleModeButton.textContent = isDarkMode ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro';
});