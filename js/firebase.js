// js/firebase.js
console.log('Firebase.js script loaded');
console.log('Firebase object:', typeof firebase);

// Configuración de Firebase (usa tu propia configuración)
const firebaseConfig = {
    apiKey: "AIzaSyCxJOpBEXZUo7WrAqDTrlJV_2kJBsL8Ym0",
    authDomain: "labflow-manager.firebaseapp.com",
    projectId: "labflow-manager",
    storageBucket: "labflow-manager.appspot.com",
    messagingSenderId: "742212306654",
    appId: "1:742212306654:web:a53bf890fc63cd5d05e44f"
};

// Inicializar Firebase
if (typeof firebase === 'undefined') {
    console.error('Firebase SDK not loaded');
} else {
    try {
        if (firebase.apps.length === 0) {
            firebase.initializeApp(firebaseConfig);
            console.log('Firebase initialized successfully');
            console.log('Firebase apps:', firebase.apps.length);
        } else {
            console.log('Firebase already initialized');
        }
    } catch (error) {
        console.error('Error initializing Firebase:', error);
    }
}
