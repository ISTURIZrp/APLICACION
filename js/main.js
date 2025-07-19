// main.js

// Inicialización de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyCxJOpBEXZUo7WrAqDTrlJV_2kJBsL8Ym0",
    authDomain: "labflow-manager.firebaseapp.com",
    projectId: "labflow-manager",
    storageBucket: "labflow-manager.appspot.com",
    messagingSenderId: "742212306654",
    appId: "1:742212306654:web:a53bf890fc63cd5d05e44f"
};

// Inicializa Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Función para cargar módulos dinámicamente
function loadModule(module) {
    const moduleContent = document.getElementById('module-content');
    switch(module) {
        case 'insumos':
            moduleContent.innerHTML = '<h2>Insumos</h2>'; // Aquí puedes cargar el contenido de insumos
            break;
        case 'movimientos':
            moduleContent.innerHTML = '<h2>Movimientos</h2>'; // Aquí puedes cargar el contenido de movimientos
            break;
        case 'pedidos':
            moduleContent.innerHTML = '<h2>Pedidos</h2>'; // Aquí puedes cargar el contenido de pedidos
            break;
        case 'equipos':
            moduleContent.innerHTML = '<h2>Equipos</h2>'; // Aquí puedes cargar el contenido de equipos
            break;
        case 'productos':
            moduleContent.innerHTML = '<h2>Productos</h2>'; // Aquí puedes cargar el contenido de productos
            break;
        case 'usuarios':
            moduleContent.innerHTML = '<h2>Usuarios</h2>'; // Aquí puedes cargar el contenido de usuarios
            break;
        default:
            moduleContent.innerHTML = '<h2>Selecciona un módulo</h2>';
    }
}

// Código adicional para autenticación y otras funcionalidades
// Manejar estado de autenticación
auth.onAuthStateChanged(async (user) => {
    if (user) {
        // Lógica para usuario autenticado
    } else {
        // Lógica para usuario no autenticado
    }
});

// Aquí puedes incluir más lógica para manejar eventos, autenticación, etc.