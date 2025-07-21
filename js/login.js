// js/login.js

import { auth, db } from './firebase.js'; // Importar auth y db

// Elementos DOM
const loginForm = document.getElementById('login-form');
const loginEmail = document.getElementById('login-email');
const loginPassword = document.getElementById('login-password');
const notificationDiv = document.getElementById('app-notification');
const notificationTitle = document.getElementById('notification-title');
const notificationMessage = document.getElementById('notification-message');

// Mostrar notificación
function showNotification(title, message, type = 'info') {
    notificationTitle.textContent = title;
    notificationMessage.textContent = message;
    notificationDiv.className = 'show ' + type;
    setTimeout(() => { 
        notificationDiv.className = ''; 
    }, 3000);
}

// Manejar inicio de sesión
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = loginEmail.value;
    const password = loginPassword.value;

    try {
        await auth.signInWithEmailAndPassword(email, password);
        window.location.href = 'home.html'; // Redirigir a home.html al iniciar sesión
    } catch (error) {
        let errorMessage = 'Error al iniciar sesión';
        switch (error.code) {
            case 'auth/user-not-found':
                errorMessage = 'Usuario no registrado';
                break;
            case 'auth/wrong-password':
                errorMessage = 'Contraseña incorrecta';
                break;
            case 'auth/invalid-email':
                errorMessage = 'Email no válido';
                break;
            default:
                errorMessage = error.message;
        }
        showNotification('Error', errorMessage, 'error');
    }
});