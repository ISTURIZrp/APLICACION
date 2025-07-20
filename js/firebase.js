// Configuración e inicialización de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyCxJOpBEXZUo7WrAqDTrlJV_2kJBsL8Ym0",
    authDomain: "labflow-manager.firebaseapp.com",
    projectId: "labflow-manager",
    storageBucket: "labflow-manager.appspot.com",
    messagingSenderId: "742212306654",
    appId: "1:742212306654:web:a53bf890fc63cd5d05e44f",
    measurementId: "G-YVZDBCJR3B"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);

// Exportar servicios
const db = firebase.firestore();
const auth = firebase.auth();
const storage = firebase.storage();

// Habilitar persistencia para funcionamiento offline
db.enablePersistence().catch(err => {
    if (err.code == 'failed-precondition') {
        console.warn("La persistencia falló debido a múltiples pestañas abiertas");
    } else if (err.code == 'unimplemented') {
        console.warn("El navegador no soporta persistencia");
    } else {
        console.error("Error en persistencia:", err);
    }
});
