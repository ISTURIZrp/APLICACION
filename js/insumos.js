import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { collection, query, orderBy, getDocs, doc, addDoc, updateDoc, deleteDoc, writeBatch, where, getDoc, runTransaction } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { auth, db } from './firebase-config.js';
import { loadSidebar } from './main.js';

// --- ELEMENTOS DEL DOM ---
const productTableBody = document.getElementById('productTableBody');
const btnAddProduct = document.getElementById('btnAddProduct');
const productModal = document.getElementById('productModal');
const productForm = document.getElementById('productForm');
const closeModalBtns = document.querySelectorAll('.close-modal-btn');
const searchInput = document.getElementById('searchInput');
// ... (puedes agregar más elementos si los necesitas)

// --- LÓGICA COMPLETA ---

async function fetchAndRenderInsumos() {
    productTableBody.innerHTML = `<tr><td colspan="6" class="loading-message">Cargando...</td></tr>`;
    try {
        const insumosQuery = query(collection(db, "insumos"), orderBy("nombre"));
        const insumosSnapshot = await getDocs(insumosQuery);
        
        if (insumosSnapshot.empty) {
            productTableBody.innerHTML = `<tr><td colspan="6" class="empty-message">No hay insumos.</td></tr>`;
            return;
        }

        let tableHtml = '';
        for (const insumoDoc of insumosSnapshot.docs) {
            const insumo = { id: insumoDoc.id, ...insumoDoc.data() };
            const lotesSnapshot = await getDocs(query(collection(db, "lotes"), where("insumo_id", "==", insumo.id)));
            const lotes = lotesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            let estadoHtml = '';
            if ((insumo.existencia_total || 0) <= 0) { estadoHtml = '<span class="status-critical">Agotado</span>'; }
            else if (insumo.existencia_total <= insumo.stock_minimo) { estadoHtml = '<span class="status-low">Bajo</span>'; }
            else { estadoHtml = '<span class="status-ok">OK</span>'; }

            tableHtml += `
                <tr class="insumo-row" data-insumo-id="${insumo.id}">
                    <td><input type="checkbox" class="insumo-checkbox" data-id="${insumo.id}"></td>
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
            if (lotes.length > 0) {
                tableHtml += `<tr class="lote-row" data-lote-for="${insumo.id}" style="display:none;"><td colspan="6"><table class="table"><thead><tr><th>Lote</th><th>Caducidad</th><th>Existencia</th><th>Acciones</th></tr></thead><tbody>`;
                lotes.forEach(lote => {
                    tableHtml += `<tr><td>${lote.lote || 'N/A'}</td><td>${lote.fecha_caducidad || 'N/A'}</td><td>${lote.existencia}</td><td class="action-buttons"><button class="btn btn-edit" data-action="edit-lote" data-lote-id="${lote.id}" data-insumo-id="${insumo.id}"><i class="mdi mdi-pencil"></i></button><button class="btn btn-delete" data-action="delete-lote" data-lote-id="${lote.id}"><i class="mdi mdi-delete"></i></button></td></tr>`;
                });
                tableHtml += `</tbody></table></td></tr>`;
            }
        }
        productTableBody.innerHTML = tableHtml;
    } catch (error) {
        console.error("Error cargando insumos:", error);
    }
}

// ... (Aquí irían las funciones openModal, closeModal, handleFormSubmit, handleDelete, etc., completas y adaptadas)

// --- EVENT LISTENERS ---
// ...

// --- PUNTO DE ENTRADA ---
onAuthStateChanged(auth, async (user) => {
    if (user) {
        await loadSidebar();
        await fetchAndRenderInsumos();
    } else {
        window.location.href = 'index.html';
    }
});
