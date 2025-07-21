// js/firebase.js

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
firebase.initializeApp(firebaseConfig);

// Exportar las instancias de Firebase
const auth = firebase.auth();
const db = firebase.firestore();
export { auth, db };