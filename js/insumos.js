// insumos.js

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
const db = firebase.firestore();

// Función para cargar los insumos desde Firestore
function loadInsumos() {
    const insumosList = document.getElementById('insumos-list');
    db.collection('insumos').get().then(snapshot => {
        snapshot.forEach(doc => {
            const insumo = doc.data();
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${doc.id}</td>
                <td>${insumo.nombre}</td>
                <td>${insumo.categoria}</td>
                <td>${insumo.cantidad}</td>
                <td>
                    <button class="btn-edit">Editar</button>
                    <button class="btn-delete">Eliminar</button>
                </td>
            `;
            insumosList.appendChild(row);
        });
    }).catch(error => {
        console.error("Error al cargar insumos:", error);
    });
}

// Evento para agregar un nuevo insumo
document.getElementById('add-insumo').addEventListener('click', () => {
    // Lógica para abrir un formulario y agregar un nuevo insumo
    alert('Funcionalidad para agregar insumo no implementada.');
});

// Cargar los insumos al cargar la página
document.addEventListener('DOMContentLoaded', loadInsumos);