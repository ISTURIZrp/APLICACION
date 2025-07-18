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
    if (!notification) return;
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
    try {
        const querySnapshot = await getDocs(collection(db, "insumos"));
        allInsumosCached = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        insumoSelect.innerHTML = '<option value="">Selecciona un insumo</option>';
        allInsumosCached.sort((a, b) => a.nombre.localeCompare(b.nombre))
            .forEach(insumo => insumoSelect.add(new Option(insumo.nombre, insumo.id)));
        insumoSelect.disabled = false;
    } catch(error) {
        console.error("Error al cargar insumos:", error);
        showNotification("Error al cargar insumos.", "error");
    }
}

async function populateLotes() {
    const insumoId = insumoSelect.value;
    loteSelect.innerHTML = '<option value="">Selecciona un lote</option>';
    if (!insumoId) return;
    try {
        const q = query(collection(db, "lotes"), where("insumo_id", "==", insumoId));
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach(doc => {
            const lote = doc.data();
            loteSelect.add(new Option(`${lote.lote} (Stock: ${lote.existencia})`, doc.id));
        });
    } catch (error) {
        console.error("Error al poblar lotes:", error);
    }
}

function addTransactionToPendingList(e) {
    e.preventDefault();
    const insumoId = insumoSelect.value;
    const tipo = document.querySelector('input[name="tipoTransaccion"]:checked')?.value;
    const cantidad = parseInt(document.getElementById('cantidad').value, 10);
    const loteId = loteSelect.value || `new-${document.getElementById('nuevoLoteInput').value.trim()}`;
    const loteNombre = loteId.startsWith('new-') ? loteId.substring(4) : loteSelect.options[loteSelect.selectedIndex].text.split(' (')[0];
    const insumoNombre = allInsumosCached.find(i => i.id === insumoId)?.nombre;

    if (!insumoId || !tipo || !cantidad || !loteNombre) {
        showNotification('Completa todos los campos requeridos.', 'error');
        return;
    }
    
    pendingTransactions.push({ insumoId, insumoNombre, loteId, loteNombre, tipo, cantidad, fechaCaducidad: document.getElementById('fechaCaducidadNuevoLote').value });
    renderPendingTransactions();
    singleTransactionForm.reset();
    loteSelectGroup.style.display = 'none';
    nuevoLoteGroup.style.display = 'none';
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
    const confirmed = await customConfirm('Confirmar Movimientos', `¿Confirmar ${pendingTransactions.length} movimiento(s)? Esta acción modificará el inventario.`);
    if (!confirmed) return;

    // 1. Calcular cambio neto por lote
    const loteChanges = new Map();
    for (const tx of pendingTransactions) {
        const change = tx.tipo === 'entrada' ? tx.cantidad : -tx.cantidad;
        const currentChange = loteChanges.get(tx.loteId) || 0;
        loteChanges.set(tx.loteId, currentChange + change);
    }

    // 2. Verificar stock ANTES de escribir
    try {
        for (const [loteId, netChange] of loteChanges.entries()) {
            if (loteId.startsWith('new-')) continue;
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

    // 3. Escribir en batch si todo es válido
    try {
        const batch = writeBatch(db);
        for (const tx of pendingTransactions) {
            let loteRef;
            if (tx.loteId.startsWith('new-')) {
                loteRef = doc(collection(db, "lotes"));
                batch.set(loteRef, { insumo_id: tx.insumoId, lote: tx.loteNombre, existencia: tx.cantidad, fecha_caducidad: tx.fechaCaducidad });
            } else {
                loteRef = doc(db, "lotes", tx.loteId);
                const loteSnap = await getDoc(loteRef);
                const change = tx.tipo === 'entrada' ? tx.cantidad : -tx.cantidad;
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
        loteSelectGroup.style.display = tipo ? 'block' : 'none';
        nuevoLoteGroup.style.display = tipo === 'entrada' ? 'block' : 'none';
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
    } else {
        window.location.href = 'index.html';
    }
});
