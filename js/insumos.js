import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { collection, query, orderBy, getDocs, doc, addDoc, updateDoc, deleteDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { auth, db } from './firebase-config.js';
import { loadSidebar } from './main.js';

// --- ELEMENTOS DEL DOM ---
const productTableBody = document.getElementById('productTableBody');
const btnAddProduct = document.getElementById('btnAddProduct');
const productModal = document.getElementById('productModal');
const productForm = document.getElementById('productForm');
const closeModalBtns = document.querySelectorAll('.close-modal-btn');
const searchInput = document.getElementById('searchInput');

// --- FUNCIONES AUXILIARES ---
function showNotification(message, type = 'success') {
    // Puedes implementar un sistema de notificaciones más avanzado si quieres.
    // Por ahora, una simple alerta servirá.
    alert(message);
}

// --- LÓGICA PRINCIPAL ---
async function fetchAndRenderInsumos() {
    productTableBody.innerHTML = `<tr><td colspan="5" class="loading-message">Cargando insumos...</td></tr>`;
    try {
        const insumosQuery = query(collection(db, "insumos"), orderBy("nombre"));
        const insumosSnapshot = await getDocs(insumosQuery);
        
        if (insumosSnapshot.empty) {
            productTableBody.innerHTML = `<tr><td colspan="5" class="empty-message">No hay insumos registrados</td></tr>`;
            return;
        }

        let tableHtml = '';
        insumosSnapshot.forEach(doc => {
            const insumo = { id: doc.id, ...doc.data() };
            
            let estadoHtml = '';
            if ((insumo.existencia_total || 0) <= 0) { estadoHtml = '<span class="status-critical">Agotado</span>'; } 
            else if (insumo.existencia_total <= insumo.stock_minimo) { estadoHtml = '<span class="status-low">Bajo</span>'; } 
            else { estadoHtml = '<span class="status-ok">OK</span>'; }

            tableHtml += `
                <tr class="insumo-row" data-insumo-id="${insumo.id}">
                    <td><strong>${insumo.nombre}</strong></td>
                    <td>${insumo.existencia_total || 0}</td>
                    <td>${insumo.stock_minimo}</td>
                    <td>${estadoHtml}</td>
                    <td class="action-buttons">
                        <button class="btn-edit" data-action="edit-insumo" data-id="${insumo.id}" title="Editar"><i class="mdi mdi-pencil"></i></button>
                        <button class="btn-delete" data-action="delete-insumo" data-id="${insumo.id}" title="Eliminar"><i class="mdi mdi-delete"></i></button>
                    </td>
                </tr>
            `;
        });
        productTableBody.innerHTML = tableHtml;
    } catch (error) {
        console.error("Error cargando insumos:", error);
        productTableBody.innerHTML = `<tr><td colspan="5" class="empty-message">Error al cargar datos</td></tr>`;
    }
}

function openModal(insumo = null) {
    productForm.reset();
    document.getElementById('modalTitle').textContent = insumo ? "Editar Insumo" : "Agregar Insumo";
    document.getElementById('insumoIdField').value = insumo ? insumo.id : '';
    document.getElementById('nombre').value = insumo ? insumo.nombre : '';
    document.getElementById('stockMinimo').value = insumo ? insumo.stock_minimo : '';
    productModal.style.display = 'flex';
}

function closeModal() {
    productModal.style.display = 'none';
}

async function handleFormSubmit(e) {
    e.preventDefault();
    const insumoId = document.getElementById('insumoIdField').value;
    const nombre = document.getElementById('nombre').value.trim();
    const stock_minimo = Number(document.getElementById('stockMinimo').value);

    if (!nombre || stock_minimo < 0) {
        showNotification('Por favor, completa los campos correctamente.', 'error');
        return;
    }

    try {
        if (insumoId) {
            await updateDoc(doc(db, "insumos", insumoId), { nombre, stock_minimo });
            showNotification('Insumo actualizado con éxito.');
        } else {
            await addDoc(collection(db, "insumos"), { nombre, stock_minimo, existencia_total: 0 });
            showNotification('Insumo agregado con éxito.');
        }
        closeModal();
        fetchAndRenderInsumos();
    } catch (error) {
        console.error("Error guardando insumo:", error);
        showNotification('Error al guardar el insumo.', 'error');
    }
}

async function handleDelete(insumoId) {
    if (!confirm('¿Estás seguro de que quieres eliminar este insumo? Esta acción no se puede deshacer.')) {
        return;
    }
    try {
        await deleteDoc(doc(db, "insumos", insumoId));
        showNotification('Insumo eliminado con éxito.');
        fetchAndRenderInsumos();
    } catch (error) {
        console.error("Error eliminando insumo:", error);
        showNotification('Error al eliminar el insumo.', 'error');
    }
}

// --- EVENT LISTENERS ---
btnAddProduct.addEventListener('click', () => openModal());
closeModalBtns.forEach(btn => btn.addEventListener('click', closeModal));
productForm.addEventListener('submit', handleFormSubmit);

searchInput.addEventListener('input', () => {
    const searchTerm = searchInput.value.toLowerCase();
    document.querySelectorAll('.insumo-row').forEach(row => {
        const nombre = row.cells[0].textContent.toLowerCase();
        row.style.display = nombre.includes(searchTerm) ? '' : 'table-row';
    });
});

// Listener para los botones de acción en la tabla
productTableBody.addEventListener('click', async (e) => {
    const target = e.target.closest('button');
    if (!target) return;

    const action = target.dataset.action;
    const insumoId = target.dataset.id;

    if (action === 'edit-insumo') {
        const docRef = doc(db, "insumos", insumoId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            openModal({ id: docSnap.id, ...docSnap.data() });
        }
    } else if (action === 'delete-insumo') {
        handleDelete(insumoId);
    }
});


// --- PUNTO DE ENTRADA ---
onAuthStateChanged(auth, async (user) => {
    if (user) {
        await loadSidebar();
        await fetchAndRenderInsumos();
    } else {
        window.location.href = 'index.html';
    }
});
