import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { collection, query, orderBy, getDocs, doc, addDoc, updateDoc, deleteDoc, getDoc, where, writeBatch, runTransaction } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { auth, db } from './firebase-config.js';
import { loadSidebar } from './main.js';

// --- ELEMENTOS DEL DOM ---
const productTableBody = document.getElementById('productTableBody');
const btnAddProduct = document.getElementById('btnAddProduct');
const productModal = document.getElementById('productModal');
const productForm = document.getElementById('productForm');
const closeModalBtns = document.querySelectorAll('.close-modal-btn');
const searchInput = document.getElementById('searchInput');
const customConfirmModal = document.getElementById('customConfirmModal');
let resolveModalPromise;

// --- FUNCIONES AUXILIARES ---
function showNotification(message, type = 'success') { alert(message); }

function customConfirm(title, message) {
    document.getElementById('modalTitleConfirm').textContent = title;
    document.getElementById('modalMessageConfirm').textContent = message;
    customConfirmModal.classList.add('visible');
    return new Promise(resolve => { resolveModalPromise = resolve; });
}

// --- LÓGICA PRINCIPAL ---
async function fetchAndRenderInsumos() {
    productTableBody.innerHTML = `<tr><td colspan="6" class="empty-message">Cargando...</td></tr>`;
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
            const lotesSnapshot = await getDocs(query(collection(db, "lotes"), where("insumo_id", "==", insumo.id)));
            const lotes = lotesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            
            let estadoHtml = `<span class="status status-ok">OK</span>`;
            if ((insumo.existencia_total || 0) <= 0) { estadoHtml = `<span class="status status-critical">Agotado</span>`; } 
            else if (insumo.existencia_total <= insumo.stock_minimo) { estadoHtml = `<span class="status status-low">Bajo</span>`; }

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
                </tr>`;
            if (lotes.length > 0) {
                tableHtml += `<tr class="lote-row" data-lote-for="${insumo.id}" style="display:none;"><td colspan="6"><table class="table"><thead><tr><th>Lote</th><th>Caducidad</th><th>Existencia</th><th>Acciones</th></tr></thead><tbody>`;
                lotes.forEach(lote => {
                    tableHtml += `<tr><td>${lote.lote || 'N/A'}</td><td>${lote.fecha_caducidad || 'N/A'}</td><td>${lote.existencia}</td><td class="action-buttons"><button class="btn btn-edit" data-action="edit-lote" data-lote-id="${lote.id}" data-insumo-id="${insumo.id}"><i class="mdi mdi-pencil"></i></button><button class="btn btn-delete" data-action="delete-lote" data-lote-id="${lote.id}"><i class="mdi mdi-delete"></i></button></td></tr>`;
                });
                tableHtml += `</tbody></table></td></tr>`;
            }
        }
        productTableBody.innerHTML = tableHtml;
    } catch (error) { console.error("Error al cargar insumos:", error); }
}

function openModal(insumo = null, lote = null) {
    productForm.reset();
    document.getElementById('insumoIdField').value = insumo ? insumo.id : '';
    document.getElementById('loteIdField').value = lote ? lote.id : '';
    
    if (lote) {
        document.getElementById('modalTitle').textContent = "Editar Lote";
        document.getElementById('nombre').value = insumo.nombre;
        document.getElementById('stockMinimo').value = insumo.stock_minimo;
        document.getElementById('nombre').disabled = true;
        document.getElementById('stockMinimo').disabled = true;
        document.getElementById('lote').value = lote.lote || '';
        document.getElementById('fechaCaducidad').value = lote.fecha_caducidad || '';
        document.getElementById('existencia').value = lote.existencia || '';
    } else if (insumo) {
        document.getElementById('modalTitle').textContent = "Editar Insumo / Añadir Lote";
        document.getElementById('nombre').value = insumo.nombre;
        document.getElementById('stockMinimo').value = insumo.stock_minimo;
        document.getElementById('nombre').disabled = false;
        document.getElementById('stockMinimo').disabled = false;
    } else {
        document.getElementById('modalTitle').textContent = "Agregar Insumo y Lote";
        document.getElementById('nombre').disabled = false;
        document.getElementById('stockMinimo').disabled = false;
    }
    productModal.classList.add('active');
}

function closeModal() {
    productModal.classList.remove('active');
}

async function handleFormSubmit(e) {
    e.preventDefault();
    const insumoId = document.getElementById('insumoIdField').value;
    const loteId = document.getElementById('loteIdField').value;
    const data = {
        nombre: document.getElementById('nombre').value.trim(),
        stock_minimo: Number(document.getElementById('stockMinimo').value),
        lote: document.getElementById('lote').value.trim(),
        fecha_caducidad: document.getElementById('fechaCaducidad').value,
        existencia: Number(document.getElementById('existencia').value)
    };
    
    try {
        await runTransaction(db, async (transaction) => {
            let finalInsumoId = insumoId;
            // Lógica para crear/actualizar insumos y lotes
            if (loteId) { // Editar Lote
                transaction.update(doc(db, "lotes", loteId), { lote: data.lote, fecha_caducidad: data.fecha_caducidad, existencia: data.existencia });
            } else if (insumoId) { // Editar Insumo o Añadirle Lote
                transaction.update(doc(db, "insumos", insumoId), { nombre: data.nombre, stock_minimo: data.stock_minimo });
                if (data.lote) {
                    transaction.set(doc(collection(db, "lotes")), { insumo_id: insumoId, lote: data.lote, fecha_caducidad: data.fecha_caducidad, existencia: data.existencia });
                }
            } else { // Crear Insumo y Lote nuevos
                const newInsumoRef = doc(collection(db, "insumos"));
                transaction.set(newInsumoRef, { nombre: data.nombre, stock_minimo: data.stock_minimo, existencia_total: 0 });
                finalInsumoId = newInsumoRef.id;
                if (data.lote) {
                    transaction.set(doc(collection(db, "lotes")), { insumo_id: finalInsumoId, lote: data.lote, fecha_caducidad: data.fecha_caducidad, existencia: data.existencia });
                }
            }
            
            // Recalcular existencia total del insumo afectado
            const lotesQuery = query(collection(db, "lotes"), where("insumo_id", "==", finalInsumoId));
            const lotesSnapshot = await getDocs(lotesQuery);
            const totalExistencia = lotesSnapshot.docs.reduce((sum, doc) => sum + (doc.data().existencia || 0), 0);
            transaction.update(doc(db, "insumos", finalInsumoId), { existencia_total: totalExistencia });
        });

        closeModal();
        fetchAndRenderInsumos();
    } catch (error) { console.error("Error guardando:", error); }
}

// --- EVENT LISTENERS ---
btnAddProduct.addEventListener('click', () => openModal());
closeModalBtns.forEach(btn => btn.addEventListener('click', closeModal));
productForm.addEventListener('submit', handleFormSubmit);

searchInput.addEventListener('input', () => { /* ... Lógica de búsqueda ... */ });

productTableBody.addEventListener('click', async (e) => {
    const target = e.target.closest('button, tr');
    if (!target) return;

    if (target.matches('.insumo-row')) {
        const loteRow = document.querySelector(`[data-lote-for="${target.dataset.insumoId}"]`);
        if (loteRow) loteRow.style.display = loteRow.style.display === 'none' ? 'table-row' : 'none';
    }

    if (target.matches('button')) {
        const action = target.dataset.action;
        if (action === 'edit-insumo') {
            const insumoSnap = await getDoc(doc(db, "insumos", target.dataset.id));
            openModal({ id: insumoSnap.id, ...insumoSnap.data() });
        }
        // Agrega lógica para editar y eliminar lotes aquí
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
