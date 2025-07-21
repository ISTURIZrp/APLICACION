// auth.js

import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { getFirestore, collection, query, where, getDocs } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

const firebaseConfig = {
    apiKey: "AIzaSyCxJOpBEXZUo7WrAqDTrlJV_2kJBsL8Ym0",
    authDomain: "labflow-manager.firebaseapp.com",
    projectId: "labflow-manager",
    storageBucket: "labflow-manager.firebasestorage.app",
    messagingSenderId: "742212306654",
    appId: "1:742212306654:web:a53bf890fc63cd5d05e44f",
    measurementId: "G-YVZDBCJR3B"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const loginForm = document.getElementById('loginForm');
const emailOrUsernameField = document.getElementById('email-username-field');
const passwordField = document.getElementById('password-field');
const loginBtn = document.getElementById('login-btn');
const errorMessageDiv = document.getElementById('error-message');

// Verificar el estado de autenticación al cargar la página
onAuthStateChanged(auth, (user) => {
    if (user) {
        // Si el usuario está autenticado, redirigir a home.html
        window.location.href = 'home.html';
    }
});

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginBtn.disabled = true;
    errorMessageDiv.textContent = '';

    const inputIdentifier = emailOrUsernameField.value.trim();
    const password = passwordField.value;
    let emailToSignIn = '';

    if (!inputIdentifier || !password) {
        errorMessageDiv.textContent = 'Ambos campos son obligatorios.';
        loginBtn.disabled = false;
        return;
    }

    // Verificar si el input es un email o un nombre de usuario
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inputIdentifier)) {
        emailToSignIn = inputIdentifier;
    } else {
        try {
            const usersRef = collection(db, 'users');
            const q = query(usersRef, where('username', '==', inputIdentifier));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                emailToSignIn = querySnapshot.docs[0].data().email;
            } else {
                errorMessageDiv.textContent = 'Usuario o contraseña incorrectos.';
                loginBtn.disabled = false;
                return;
            }
        } catch (error) {
            errorMessageDiv.textContent = 'Error del servidor. Intenta de nuevo.';
            loginBtn.disabled = false;
            return;
        }
    }

    try {
        await signInWithEmailAndPassword(auth, emailToSignIn, password);
        // Si el inicio de sesión es exitoso, redirigir a home.html
    } catch (error) {
        errorMessageDiv.textContent = 'Usuario o contraseña incorrectos.';
    } finally {
        loginBtn.disabled = false;
    }
});