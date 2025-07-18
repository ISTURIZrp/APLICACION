import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { collection, query, orderBy, getDocs, doc, addDoc, updateDoc, deleteDoc, getDoc, writeBatch, where } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { auth, db } from './firebase-config.js';
import { loadSidebar } from './main.js';

// --- ELEMENTOS DEL DOM ---
const productTableBody = document.getElementById('productTableBody');
const btnAddProduct = document.getElementById('btnAddProduct');
const productModal = document.getElementById('productModal');
const productForm = document.getElementById('productForm');
const closeModalBtns = document.querySelectorAll('.close-modal-btn');
const searchInput = document.getElementById('searchInput');
const csvActionsContainer = document.getElementById('csvActionsContainer');
const btnCSVActions = document.getElementById('btnCSVActions');
const btnExportCSV = document.getElementById('btnExportCSV');
const csvFileInput = document.getElementById('csvFileInput');

// --- FUNCIONES AUXILIARES ---
function showNotification(message, type = 'success') {
    alert(message); // Usando alerta simple por ahora
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
                        <button class="btn-edit" data-action="edit-insumo" data-id="${insumo.id}" title="Editar"><i class="mdi mdi-pencil"></i> Editar</button>
                        <button class="btn-delete" data-action="delete-insumo" data-id="${insumo.id}" title="Eliminar"><i class="mdi mdi-delete"></i> Eliminar</button>
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
    productModal.classList.add('active');
}

function closeModal() {
    productModal.classList.remove('active');
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
    if (!confirm('¿Estás seguro de que quieres eliminar este insumo y todos sus lotes asociados?')) {
        return;
    }
    try {
        // Eliminar lotes asociados
        const lotesQuery = query(collection(db, "lotes"), where("insumo_id", "==", insumoId));
        const lotesSnapshot = await getDocs(lotesQuery);
        const batch = writeBatch(db);
        lotesSnapshot.forEach(doc => batch.delete(doc.ref));
        await batch.commit();

        // Eliminar insumo
        await deleteDoc(doc(db, "insumos", insumoId));
        
        showNotification('Insumo eliminado con éxito.');
        fetchAndRenderInsumos();
    } catch (error) {
        console.error("Error eliminando insumo:", error);
        showNotification('Error al eliminar el insumo.', 'error');
    }
}

async function exportToCSV() {
    showNotification("Generando archivo CSV...", "info");
    let csvContent = "data:text/csv;charset=utf-8,NombreInsumo,StockMinimo,ExistenciaTotal,Lote,FechaCaducidad,ExistenciaLote\r\n";
    
    try {
        const insumosSnapshot = await getDocs(query(collection(db, "insumos"), orderBy("nombre")));
        for (const insumoDoc of insumosSnapshot.docs) {
            const insumo = { id: insumoDoc.id, ...insumoDoc.data() };
            const lotesSnapshot = await getDocs(query(collection(db, "lotes"), where("insumo_id", "==", insumo.id)));
            
            if (lotesSnapshot.empty) {
                csvContent += `${insumo.nombre},${insumo.stock_minimo},${insumo.existencia_total},N/A,N/A,0\r\n`;
            } else {
                lotesSnapshot.forEach(loteDoc => {
                    const lote = loteDoc.data();
                    csvContent += `${insumo.nombre},${insumo.stock_minimo},${insumo.existencia_total},${lote.lote || ''},${lote.fecha_caducidad || ''},${lote.existencia || 0}\r\n`;
                });
            }
        }

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "inventario_insumos.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (error) {
        console.error("Error al exportar CSV:", error);
        showNotification("Error al generar el CSV.", "error");
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
        row.style.display = nombre.includes(searchTerm) ? '' : 'none';
    });
});

productTableBody.addEventListener('click', async (e) => {
    const button = e.target.closest('button');
    if (!button) return;

    const action = button.dataset.action;
    const insumoId = button.dataset.id;

    if (action === 'edit-insumo') {
        const docSnap = await getDoc(doc(db, "insumos", insumoId));
        if (docSnap.exists()) {
            openModal({ id: docSnap.id, ...docSnap.data() });
        }
    } else if (action === 'delete-insumo') {
        handleDelete(insumoId);
    }
});

btnCSVActions.addEventListener('click', (e) => {
    e.stopPropagation();
    csvActionsContainer.classList.toggle('show');
});

document.addEventListener('click', () => {
    if (csvActionsContainer.classList.contains('show')) {
        csvActionsContainer.classList.remove('show');
    }
});

btnExportCSV.addEventListener('click', (e) => {
    e.preventDefault();
    exportToCSV();
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
