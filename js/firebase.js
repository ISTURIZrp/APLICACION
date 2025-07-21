// js/firebase.js
console.log('Firebase.js script loaded');

// Configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyCxJOpBEXZUo7WrAqDTrlJV_2kJBsL8Ym0",
    authDomain: "labflow-manager.firebaseapp.com",
    projectId: "labflow-manager",
    storageBucket: "labflow-manager.firebasestorage.app",
    messagingSenderId: "742212306654",
    appId: "1:742212306654:web:a53bf890fc63cd5d05e44f",
    measurementId: "G-YVZDBCJR3B"
};

// Variable global para el estado de Firebase
window.firebaseReady = false;
window.firebaseApp = null;

// Función para inicializar Firebase (global)
window.initializeFirebase = function() {
    return new Promise((resolve, reject) => {
        if (typeof firebase === 'undefined') {
            console.error('Firebase SDK not loaded');
            reject(new Error('Firebase SDK not loaded'));
            return;
        }

        try {
            if (firebase.apps.length === 0) {
                window.firebaseApp = firebase.initializeApp(firebaseConfig);
                console.log('Firebase initialized successfully');
            } else {
                window.firebaseApp = firebase.apps[0];
                console.log('Firebase already initialized');
            }

            window.firebaseReady = true;
            console.log('Firebase apps count:', firebase.apps.length);
            resolve(window.firebaseApp);
        } catch (error) {
            console.error('Error initializing Firebase:', error);
            reject(error);
        }
    });
}

// Función para verificar que Firebase esté listo (global)
window.waitForFirebase = function() {
    return new Promise((resolve, reject) => {
        if (window.firebaseReady && firebase.apps.length > 0) {
            resolve(true);
            return;
        }

        // Intentar inicializar si no está listo
        window.initializeFirebase()
            .then(() => resolve(true))
            .catch(reject);
    });
}

// Inicializar Firebase inmediatamente
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', window.initializeFirebase);
} else {
    window.initializeFirebase();
}
