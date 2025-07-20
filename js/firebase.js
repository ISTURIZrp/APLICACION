// Configuración de Firebase
const firebaseConfig = {
            apiKey: "AIzaSyCxJOpBEXZUo7WrAqDTrlJV_2kJBsL8Ym0",
            authDomain: "labflow-manager.firebaseapp.com",
            projectId: "labflow-manager",
            storageBucket: "labflow-manager.appspot.com",
            messagingSenderId: "742212306654",
            appId: "1:742212306654:web:a53bf890fc63cd5d05e44f"
        };

// Inicializar Firebase
console.log("Inicializando Firebase...");
firebase.initializeApp(firebaseConfig);

// Referencias a servicios de Firebase
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

console.log("Firebase inicializado correctamente");

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