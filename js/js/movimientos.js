import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { collection, query, where, getDocs, doc, getDoc, writeBatch } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { auth, db } from './firebase-config.js';
import { loadSidebar } from './main.js';

// --- ELEMENTOS DEL DOM ---
const singleTransactionForm = document.getElementById('singleTransactionForm');
const insumoSelect = document.getElementById('insumoSelect');
const loteSelect = document.getElementById('loteSelect');
const loteSelectGroup = document.getElementById('loteSelectGroup');
const nuevoLoteGroup = document.getElementById('nuevoLoteGroup');
const pendingTransactionsTableBody = document.getElementById('pendingTransactionsTableBody');
const confirmAllTransactionsBtn = document.getElementById('confirmAllTransactionsBtn');
const transactionsHistoryTableBody = document.getElementById('transactionsHistoryTableBody');
const customConfirmModal = document.getElementById('customConfirmModal');

let pendingTransactions = [];
let allInsumosCached = [];
let currentUserEmail = null;
let resolveModalPromise;

// --- FUNCIONES AUXILIARES ---
function showNotification(message, type = 'info') {
    const notification = document.getElementById('app-notification');
    notification.textContent = message;
    notification.className = `show ${type}`;
    setTimeout(() => notification.classList.remove('show'), 3000);
}

function customConfirm(title, message) {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalMessage').textContent = message;
    customConfirmModal.classList.add('visible');
    return new Promise(resolve => {
        resolveModalPromise = resolve;
    });
}

// --- LÓGICA PRINCIPAL ---
async function loadInsumos() {
    const querySnapshot = await getDocs(collection(db, "insumos"));
    allInsumosCached = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    insumoSelect.innerHTML = '<option value="">Selecciona un insumo</option>';
    allInsumosCached.sort((a, b) => a.nombre.localeCompare(b.nombre))
        .forEach(insumo => insumoSelect.add(new Option(insumo.nombre, insumo.id)));
    insumoSelect.disabled = false;
}

async function populateLotes() {
    const insumoId = insumoSelect.value;
    loteSelect.innerHTML = '<option value="">Selecciona un lote</option>';
    if (!insumoId) return;
    const q = query(collection(db, "lotes"), where("insumo_id", "==", insumoId));
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach(doc => {
        const lote = doc.data();
        loteSelect.add(new Option(`${lote.lote} (Stock: ${lote.existencia})`, doc.id));
    });
}

function addTransactionToPendingList(e) {
    e.preventDefault();
    const insumoId = insumoSelect.value;
    const tipo = document.querySelector('input[name="tipoTransaccion"]:checked')?.value;
    const cantidad = parseInt(document.getElementById('cantidad').value, 10);
    const loteId = loteSelect.value || `new-${document.getElementById('nuevoLoteInput').value.trim()}`;
    const loteNombre = loteId.startsWith('new-') ? loteId.substring(4) : loteSelect.options[loteSelect.selectedIndex].text.split(' (')[0];

    if (!insumoId || !tipo || !cantidad || !loteNombre) {
        showNotification('Completa todos los campos requeridos.', 'error');
        return;
    }
    const insumoNombre = allInsumosCached.find(i => i.id === insumoId)?.nombre;
    pendingTransactions.push({ insumoId, insumoNombre, loteId, loteNombre, tipo, cantidad, fechaCaducidad: document.getElementById('fechaCaducidadNuevoLote').value });
    renderPendingTransactions();
    singleTransactionForm.reset();
}

function renderPendingTransactions() {
    pendingTransactionsTableBody.innerHTML = '';
    if (pendingTransactions.length === 0) {
        pendingTransactionsTableBody.innerHTML = '<tr><td colspan="5" class="empty-message">No hay movimientos pendientes</td></tr>';
        confirmAllTransactionsBtn.disabled = true;
        return;
    }
    confirmAllTransactionsBtn.disabled = false;
    pendingTransactions.forEach((tx, index) => {
        const row = `<tr><td>${tx.insumoNombre}</td><td>${tx.loteNombre}</td><td class="transaction-type ${tx.tipo}">${tx.tipo}</td><td>${tx.cantidad}</td><td><button class="btn-remove" data-index="${index}">Quitar</button></td></tr>`;
        pendingTransactionsTableBody.innerHTML += row;
    });
}

async function confirmAllTransactions() {
    if (pendingTransactions.length === 0) return;
    const confirmed = await customConfirm('Confirmar Movimientos', `¿Estás seguro de confirmar ${pendingTransactions.length} movimiento(s)? Esta acción modificará el inventario.`);
    if (!confirmed) return;

    // 1. Calcular el cambio neto por cada lote
    const loteChanges = new Map();
    for (const tx of pendingTransactions) {
        const change = tx.tipo === 'entrada' ? tx.cantidad : -tx.cantidad;
        const currentChange = loteChanges.get(tx.loteId) || 0;
        loteChanges.set(tx.loteId, currentChange + change);
    }

    // 2. Verificar el stock de todos los lotes afectados ANTES de escribir
    try {
        for (const [loteId, netChange] of loteChanges.entries()) {
            if (loteId.startsWith('new-')) continue; // Lotes nuevos no necesitan verificación de stock
            const loteRef = doc(db, "lotes", loteId);
            const loteSnap = await getDoc(loteRef);
            if (!loteSnap.exists() || (loteSnap.data().existencia + netChange) < 0) {
                throw new Error(`Stock insuficiente para el lote ${loteSnap.data().lote}.`);
            }
        }
    } catch (error) {
        showNotification(error.message, 'error');
        return;
    }

    // 3. Si todo es válido, realizar la escritura en batch
    try {
        const batch = writeBatch(db);
        for (const tx of pendingTransactions) {
            let loteRef;
            if (tx.loteId.startsWith('new-')) {
                loteRef = doc(collection(db, "lotes")); // Crea referencia para nuevo lote
                batch.set(loteRef, { insumo_id: tx.insumoId, lote: tx.loteNombre, existencia: tx.cantidad, fecha_caducidad: tx.fechaCaducidad });
            } else {
                loteRef = doc(db, "lotes", tx.loteId);
                const change = tx.tipo === 'entrada' ? tx.cantidad : -tx.cantidad;
                // Para actualizar, necesitamos el valor actual, así que este enfoque simple es limitado. Una transacción sería más robusta.
                // Este batch actualizará usando los valores pre-calculados, asumiendo que el chequeo fue suficiente.
                const loteSnap = await getDoc(loteRef);
                const newStock = (loteSnap.data().existencia || 0) + change;
                batch.update(loteRef, { existencia: newStock });
            }
            const transaccionRef = doc(collection(db, "transacciones"));
            batch.set(transaccionRef, { insumo_id: tx.insumoId, insumo_nombre: tx.insumoNombre, lote: tx.loteNombre, tipo: tx.tipo, cantidad: tx.cantidad, fecha_transaccion: new Date().toISOString(), responsable: currentUserEmail });
        }
        await batch.commit();
        showNotification('Movimientos confirmados con éxito.');
        pendingTransactions = [];
        renderPendingTransactions();
        // Aquí deberías recargar el historial y los lotes del formulario
        populateLotes();
    } catch (error) {
        showNotification('Error al confirmar movimientos.', 'error');
        console.error(error);
    }
}


// --- EVENT LISTENERS ---
insumoSelect.addEventListener('change', populateLotes);
document.querySelectorAll('input[name="tipoTransaccion"]').forEach(radio => {
    radio.addEventListener('change', () => {
        const tipo = radio.value;
        loteSelectGroup.style.display = (tipo) ? 'block' : 'none';
        nuevoLoteGroup.style.display = (tipo === 'entrada') ? 'block' : 'none';
    });
});
singleTransactionForm.addEventListener('submit', addTransactionToPendingList);
confirmAllTransactionsBtn.addEventListener('click', confirmAllTransactions);
pendingTransactionsTableBody.addEventListener('click', e => {
    if (e.target.classList.contains('btn-remove')) {
        pendingTransactions.splice(e.target.dataset.index, 1);
        renderPendingTransactions();
    }
});
document.getElementById('modalConfirmBtn').addEventListener('click', () => { if (resolveModalPromise) resolveModalPromise(true); customConfirmModal.classList.remove('visible'); });
document.getElementById('modalCancelBtn').addEventListener('click', () => { if (resolveModalPromise) resolveModalPromise(false); customConfirmModal.classList.remove('visible'); });


// --- PUNTO DE ENTRADA ---
onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUserEmail = user.email;
        await loadSidebar();
        await loadInsumos();
        // await loadTransactionsHistory();
    } else {
        window.location.href = 'index.html';
    }
});
