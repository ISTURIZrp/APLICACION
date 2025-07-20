// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyA1234567890abcdefghijklmnopqrstuvwxyz",
  authDomain: "labflow-manager.firebaseapp.com",
  projectId: "labflow-manager",
  storageBucket: "labflow-manager.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890abcdef",
  measurementId: "G-ABCDEFGHIJ"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);

// Referencias a servicios de Firebase
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// Configuración de Firestore
db.settings({
  cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED
});

// Habilitar persistencia offline
db.enablePersistence()
  .catch(err => {
    if (err.code === 'failed-precondition') {
      console.error('Persistencia falló: múltiples pestañas abiertas');
    } else if (err.code === 'unimplemented') {
      console.error('El navegador no soporta persistencia offline');
    }
  }); 
