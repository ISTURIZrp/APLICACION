// js/home.js

import { auth, db } from './firebase.js'; // Importar auth y db

// Elementos DOM
const userNameDisplay = document.getElementById('user-name-display');
const userRoleDisplay = document.getElementById('user-role-display');
const logoutBtn = document.getElementById('logout-btn');
const notificationDiv = document.getElementById('app-notification');
const notificationTitle = document.getElementById('notification-title');
const notificationMessage = document.getElementById('notification-message');

// Manejar el estado de autenticación
auth.onAuthStateChanged(async (user) => {
    if (user) {
        // Usuario autenticado
        try {
            const userDoc = await db.collection('users').doc(user.uid).get();
            if (userDoc.exists) {
                const userData = userDoc.data();
                userNameDisplay.textContent = userData.displayName || user.email;
                userRoleDisplay.textContent = userData.role || 'Usuario';
            } else {
                console.error("El documento del usuario no existe en Firestore.");
                showNotification('Error', 'No se encontraron datos para el usuario', 'error');
            }
        } catch (error) {
            console.error("Error al obtener datos del usuario:", error);
            showNotification('Error', 'No se pudieron cargar los datos del usuario', 'error');
        }
    } else {
        // No autenticado, redirigir a la página de inicio de sesión
        window.location.href = 'index.html';
    }
});

// Manejar cierre de sesión
logoutBtn.addEventListener('click', async (e) => {
    e.preventDefault(); // Evitar la acción predeterminada del enlace
    try {
        await auth.signOut(); // Cerrar sesión
        showNotification('Sesión cerrada', 'Has cerrado sesión correctamente', 'info');
        window.location.href = 'index.html'; // Redirigir a la página de inicio de sesión
    } catch (error) {
        showNotification('Error', 'No se pudo cerrar la sesión', 'error');
    }
});

// Mostrar notificación
function showNotification(title, message, type = 'info') {
    notificationTitle.textContent = title;
    notificationMessage.textContent = message;
    notificationDiv.className = 'show ' + type;
    setTimeout(() => { 
        notificationDiv.className = ''; 
    }, 3000);
}