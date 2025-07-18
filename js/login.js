import { signInWithEmailAndPassword, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';
import { collection, query, where, getDocs } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { auth, db } from './firebase-config.js';

const loginForm = document.getElementById('loginForm');
const emailOrUsernameField = document.getElementById('email-username-field');
const passwordField = document.getElementById('password-field');
const errorMessageDiv = document.getElementById('error-message');
const loginBtn = document.getElementById('login-btn');

// Si el usuario ya está autenticado, lo redirige al home.
onAuthStateChanged(auth, (user) => {
    if (user) {
        window.location.href = 'home.html';
    }
});

// Maneja el evento de envío del formulario.
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginBtn.disabled = true;
    errorMessageDiv.textContent = '';
    let emailToSignIn = emailOrUsernameField.value.trim();
    const password = passwordField.value;

    if (!emailToSignIn || !password) {
        errorMessageDiv.textContent = 'Ambos campos son obligatorios.';
        loginBtn.disabled = false;
        return;
    }

    // Si no es un email, búscalo como nombre de usuario en Firestore
    if (!emailToSignIn.includes('@')) {
        try {
            const q = query(collection(db, 'users'), where('username', '==', emailToSignIn));
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
                emailToSignIn = querySnapshot.docs[0].data().email;
            } else {
                errorMessageDiv.textContent = 'Usuario o contraseña incorrectos.';
                loginBtn.disabled = false;
                return;
            }
        } catch (error) {
            errorMessageDiv.textContent = 'Error al verificar usuario.';
            loginBtn.disabled = false;
            return;
        }
    }
    
    // Intenta iniciar sesión con el email
    try {
        await signInWithEmailAndPassword(auth, emailToSignIn, password);
        // La redirección la maneja onAuthStateChanged
    } catch (error) {
        errorMessageDiv.textContent = 'Usuario o contraseña incorrectos.';
    } finally {
        loginBtn.disabled = false;
    }
});
