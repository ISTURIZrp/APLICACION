import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { auth } from './firebase-config.js';

// --- Elementos del DOM ---
const loginContainer = document.getElementById('login-container'); // Suponiendo que aún lo necesitas como referencia
const appContent = document.getElementById('app-content');
const btnLogout = document.getElementById('btnLogout');
const userInfoBox = document.getElementById('userInfoBox');
const userDropdown = document.getElementById('userDropdown');
const userNameDisplay = document.getElementById('user-name-display');
const userRoleDisplay = document.getElementById('user-role-display');

// --- Lógica Principal ---

// Se ejecuta cuando el estado de autenticación cambia
onAuthStateChanged(auth, (user) => {
    if (user) {
        // Usuario autenticado: muestra el contenido principal
        appContent.style.display = 'block';
        userNameDisplay.textContent = user.displayName || user.email;
        userRoleDisplay.textContent = "Administrador"; // Puedes cambiar esto si gestionas roles
    } else {
        // Usuario no autenticado: redirige a la página de login
        window.location.href = 'index.html';
    }
});

// --- Event Listeners ---

// Botón para cerrar sesión
btnLogout.addEventListener('click', () => {
    signOut(auth);
});

// Menú desplegable del usuario
userInfoBox.addEventListener('click', () => {
    userDropdown.classList.toggle('show');
});

// Cierra el menú si se hace clic fuera
document.addEventListener('click', (e) => {
    if (!userInfoBox.contains(e.target)) {
        userDropdown.classList.remove('show');
    }
});

// Lógica para expandir/colapsar los módulos
document.querySelectorAll('.module-header').forEach(header => {
    header.addEventListener('click', () => {
        header.closest('.module').classList.toggle('active');
    });
});
