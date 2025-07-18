import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { collection, query, orderBy, getDocs, doc, addDoc, updateDoc, deleteDoc, runTransaction, writeBatch, where, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { auth, db } from './firebase-config.js';
import { loadSidebar } from './main.js';

// --- ELEMENTOS DEL DOM ---
const productTableBody = document.getElementById('productTableBody');
const btnAddProduct = document.getElementById('btnAddProduct');
const productModal = document.getElementById('productModal');
const productForm = document.getElementById('productForm');
const saveBtn = document.getElementById('saveBtn');
const closeModalBtns = document.querySelectorAll('.close-modal-btn');
const searchInput = document.getElementById('searchInput');

// --- LÓGICA PRINCIPAL ---

async function fetchAndRenderInsumos() {
    productTableBody.innerHTML = `<tr><td colspan="6" class="loading-message">Cargando insumos...</td></tr>`;
    try {
        const insumosQuery = query(collection(db, "insumos"), orderBy("nombre"));
        const insumosSnapshot = await getDocs(insumosQuery);
        
        if (insumosSnapshot.empty) {
            productTableBody.innerHTML = `<tr><td colspan="6" class="empty-message">No hay insumos registrados</td></tr>`;
            return;
        }

        let tableHtml = '';
        for (const insumoDoc of insumosSnapshot.docs) {
            const insumo = { id: insumoDoc.id, ...insumoDoc.data() };
            
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
                        <button class="btn btn-edit" data-action="edit-insumo" data-id="${insumo.id}"><i class="mdi mdi-pencil"></i></button>
                        <button class="btn btn-delete" data-action="delete-insumo" data-id="${insumo.id}"><i class="mdi mdi-delete"></i></button>
                    </td>
                </tr>
            `;
        }
        productTableBody.innerHTML = tableHtml;
    } catch (error) {
        console.error("Error cargando insumos:", error);
        productTableBody.innerHTML = `<tr><td colspan="6" class="empty-message">Error al cargar datos</td></tr>`;
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
        // Simple validación
        return;
    }

    try {
        if (insumoId) {
            // Actualizar
            await updateDoc(doc(db, "insumos", insumoId), { nombre, stock_minimo });
        } else {
            // Crear nuevo
            await addDoc(collection(db, "insumos"), { nombre, stock_minimo, existencia_total: 0 });
        }
        closeModal();
        fetchAndRenderInsumos();
    } catch (error) {
        console.error("Error guardando insumo:", error);
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

// --- PUNTO DE ENTRADA ---
onAuthStateChanged(auth, async (user) => {
    if (user) {
        await loadSidebar();
        await fetchAndRenderInsumos();
    } else {
        window.location.href = 'index.html';
    }
});
