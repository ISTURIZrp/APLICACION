// js/insumos.js

document.addEventListener('DOMContentLoaded', () => {
    // --- Comprobación de que estamos en la página correcta ---
    if (!document.getElementById('tableProducts')) {
        return; // Salir si no estamos en la página de insumos
    }

    // --- Referencias a elementos del DOM ---
    const addProductBtn = document.getElementById('btnAddProduct');
    const productModal = document.getElementById('productModal');
    const closeModalBtns = document.querySelectorAll('.close-modal-btn');
    const modalTitle = document.getElementById('modalTitle');
    const productForm = document.getElementById('productForm');
    const insumoIdField = document.getElementById('insumoIdField');
    const loteIdField = document.getElementById('loteIdField');

    const nombreInput = document.getElementById('nombre');
    const unidadMedidaInput = document.getElementById('unidadMedida');
    const stockMinimoInput = document.getElementById('stockMinimo');

    const loteInput = document.getElementById('lote');
    const fechaCaducidadInput = document.getElementById('fechaCaducidad');
    const existenciaLoteInput = document.getElementById('existencia');

    const productTableBody = document.getElementById('productTableBody');
    const searchInput = document.getElementById('searchInput');

    // --- Instancias de Firebase (asumiendo que son globales desde firebase-config.js) ---
    // Si no son globales, necesitarías importarlas o pasarlas.
    // Para el SDK compat, suelen ser accesibles globalmente si firebase-config.js se carga antes.
    const auth = firebase.auth();
    const db = firebase.firestore();

    let currentUserUid = null; // Para almacenar el UID del usuario actual

    // --- Observador de Autenticación para Insumos ---
    // Este observador es específico para la página de insumos
    auth.onAuthStateChanged(user => {
        if (user) {
            currentUserUid = user.uid;
            loadInsumosRealtime(); // Cargar insumos una vez que el usuario esté logueado
        } else {
            currentUserUid = null;
            // Opcional: Limpiar tabla o redirigir si el usuario cierra sesión aquí
            productTableBody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px;">Por favor, inicie sesión para ver los insumos.</td></tr>';
            // Considera redirigir a la página de login si es necesario
            // if (!window.location.pathname.includes('login.html')) {
            //     window.location.href = 'index.html';
            // }
        }
    });

    // --- Funciones para el Modal ---
    function openModal(mode, insumoData = null, loteData = null) {
        productModal.classList.add('active');
        productForm.reset();

        insumoIdField.value = '';
        loteIdField.value = '';

        // Resetea la visibilidad de los campos (importante para reusar el modal)
        nombreInput.closest('.form-group').style.display = 'block';
        unidadMedidaInput.closest('.form-group').style.display = 'block';
        stockMinimoInput.closest('.form-group').style.display = 'block';
        loteInput.closest('.form-group').style.display = 'block';
        fechaCaducidadInput.closest('.form-group').style.display = 'block';
        existenciaLoteInput.closest('.form-group').style.display = 'block';
        document.querySelector('hr').style.display = 'block'; // Mostrar la línea separadora
        document.querySelector('h3').style.display = 'block'; // Mostrar el título de lote

        if (mode === 'add') {
            modalTitle.textContent = 'Agregar Insumo / Lote';
        } else if (mode === 'edit-insumo' && insumoData) {
            modalTitle.textContent = 'Editar Insumo';
            insumoIdField.value = insumoData.id;

            nombreInput.value = insumoData.nombre;
            unidadMedidaInput.value = insumoData.unidadMedida;
            stockMinimoInput.value = insumoData.stockMinimo;

            // Ocultar campos de lote
            loteInput.closest('.form-group').style.display = 'none';
            fechaCaducidadInput.closest('.form-group').style.display = 'none';
            existenciaLoteInput.closest('.form-group').style.display = 'none';
            document.querySelector('hr').style.display = 'none';
            document.querySelector('h3').style.display = 'none';

        } else if (mode === 'add-lote' && insumoData) {
            modalTitle.textContent = `Agregar Lote a: ${insumoData.nombre}`;
            insumoIdField.value = insumoData.id;

            // Ocultar campos del insumo principal
            nombreInput.closest('.form-group').style.display = 'none';
            unidadMedidaInput.closest('.form-group').style.display = 'none';
            stockMinimoInput.closest('.form-group').style.display = 'none';

        } else if (mode === 'edit-lote' && insumoData && loteData) {
            modalTitle.textContent = `Editar Lote de: ${insumoData.nombre}`;
            insumoIdField.value = insumoData.id;
            loteIdField.value = loteData.id;

            // Ocultar campos del insumo principal
            nombreInput.closest('.form-group').style.display = 'none';
            unidadMedidaInput.closest('.form-group').style.display = 'none';
            stockMinimoInput.closest('.form-group').style.display = 'none';

            // Precargar campos de lote
            loteInput.value = loteData.numeroLote;
            fechaCaducidadInput.value = loteData.fechaCaducidad;
            existenciaLoteInput.value = loteData.existencia;
        }
    }

    function closeModal() {
        productModal.classList.remove('active');
        productForm.reset();
        insumoIdField.value = '';
        loteIdField.value = '';
    }

    closeModalBtns.forEach(btn => btn.addEventListener('click', closeModal));
    addProductBtn.addEventListener('click', () => openModal('add'));

    // --- Lógica para el Formulario (Agregar/Editar) con Firestore ---
    productForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!currentUserUid) {
            alert('Debe iniciar sesión para realizar esta operación.');
            return;
        }

        const insumoId = insumoIdField.value;
        const loteId = loteIdField.value;

        const nombre = nombreInput.value.trim();
        const unidadMedida = unidadMedidaInput.value.trim();
        const stockMinimo = parseInt(stockMinimoInput.value);

        const numeroLote = loteInput.value.trim();
        const fechaCaducidad = fechaCaducidadInput.value;
        const existenciaLote = parseInt(existenciaLoteInput.value);

        try {
            if (insumoId && loteId) {
                // Editando un lote existente
                await db.collection('users').doc(currentUserUid)
                        .collection('insumos').doc(insumoId)
                        .collection('lotes').doc(loteId).update({
                    numeroLote,
                    fechaCaducidad,
                    existencia: existenciaLote
                });
                alert('Lote actualizado exitosamente.');
            } else if (insumoId) {
                // Editando un insumo existente (sin lote o añadiendo nuevo lote a un insumo existente)
                const insumoRef = db.collection('users').doc(currentUserUid).collection('insumos').doc(insumoId);

                // Si se muestran y editan los campos del insumo principal
                if (nombreInput.closest('.form-group').style.display !== 'none') {
                    await insumoRef.update({
                        nombre,
                        unidadMedida,
                        stockMinimo
                    });
                    alert('Insumo actualizado exitosamente.');
                }

                // Si se están agregando datos de un nuevo lote a un insumo existente
                if (loteInput.closest('.form-group').style.display !== 'none' && numeroLote && fechaCaducidad && !isNaN(existenciaLote)) {
                    await insumoRef.collection('lotes').add({
                        numeroLote,
                        fechaCaducidad,
                        existencia: existenciaLote,
                        createdAt: firebase.firestore.FieldValue.serverTimestamp() // Timestamp para ordenar
                    });
                    alert('Nuevo lote agregado al insumo.');
                }

            } else {
                // Agregando un nuevo insumo con su primer lote
                const newInsumoRef = await db.collection('users').doc(currentUserUid).collection('insumos').add({
                    nombre,
                    unidadMedidad: unidadMedida, // Corregido: unidadMedida (typo)
                    stockMinimo,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp() // Timestamp para ordenar
                });

                if (numeroLote && fechaCaducidad && !isNaN(existenciaLote)) {
                    await newInsumoRef.collection('lotes').add({
                        numeroLote,
                        fechaCaducidad,
                        existencia: existenciaLote,
                        createdAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                }
                alert('Insumo y lote agregados exitosamente.');
            }

            closeModal();
        } catch (error) {
            console.error('Error al guardar/actualizar:', error);
            alert('Error al guardar/actualizar el insumo/lote: ' + error.message);
        }
    });

    // --- Funciones de Renderizado de Tabla (con datos de Firestore) ---

    // Este array se usará para el filtrado local y para mantener una copia de los datos
    let currentInsumosData = [];

    function calculateTotalExistence(insumo) {
        // En Firestore, los lotes no se cargan automáticamente con el insumo principal
        // Esta función ahora solo suma lo que ya tenemos en 'lotes' de la estructura
        // que recuperamos o construimos. Para una suma en tiempo real de lotes
        // podríamos necesitar una función de Cloud Function o una consulta independiente.
        return insumo.lotes ? insumo.lotes.reduce((total, lote) => total + lote.existencia, 0) : 0;
    }

    function getStatusClass(insumo) {
        const totalExistence = calculateTotalExistence(insumo);
        if (totalExistence <= 0) {
            return 'status-critical';
        } else if (totalExistence <= insumo.stockMinimo) {
            return 'status-low';
        }
        return 'status-ok';
    }

    function getStatusText(insumo) {
        const totalExistence = calculateTotalExistence(insumo);
        if (totalExistence <= 0) {
            return 'Crítico';
        } else if (totalExistence <= insumo.stockMinimo) {
            return 'Bajo';
        }
        return 'Óptimo';
    }

    function renderTable(dataToRender) {
        productTableBody.innerHTML = '';

        if (dataToRender.length === 0) {
            productTableBody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 20px;">No hay insumos registrados.</td></tr>';
            return;
        }

        dataToRender.forEach(insumo => {
            const row = document.createElement('tr');
            const totalExistence = calculateTotalExistence(insumo);
            const statusClass = getStatusClass(insumo);
            const statusText = getStatusText(insumo);

            row.innerHTML = `
                <td><input type="checkbox" data-id="${insumo.id}" class="select-row-checkbox"></td>
                <td>
                    ${insumo.nombre} (${insumo.unidadMedida})
                    <div style="font-size: 0.85em; color: var(--text-secondary); margin-top: 5px;">
                        ${insumo.lotes && insumo.lotes.length > 0 ? insumo.lotes.map(lote => `
                            <span style="display: block;">
                                Lote: ${lote.numeroLote} | Cant: ${lote.existencia} | Vence: ${lote.fechaCaducidad}
                                <span class="action-buttons">
                                    <button class="btn-edit-lote" data-insumo-id="${insumo.id}" data-lote-id="${lote.id}" title="Editar Lote"><i class="mdi mdi-pencil"></i></button>
                                    <button class="btn-delete-lote" data-insumo-id="${insumo.id}" data-lote-id="${lote.id}" title="Eliminar Lote"><i class="mdi mdi-delete"></i></button>
                                </span>
                            </span>
                        `).join('') : '<span style="color: #6c757d;">Sin lotes registrados</span>'}
                        <button class="btn-add-lote" data-insumo-id="${insumo.id}" title="Agregar Lote a este Insumo" style="background: none; border: 1px dashed var(--accent-primary); color: var(--accent-primary); padding: 5px 10px; margin-top: 5px; font-size: 0.9em;"><i class="mdi mdi-plus"></i> Añadir Lote</button>
                    </div>
                </td>
                <td>${totalExistence} ${insumo.unidadMedida}</td>
                <td>${insumo.stockMinimo} ${insumo.unidadMedida}</td>
                <td class="${statusClass}">${statusText}</td>
                <td class="action-buttons">
                    <button class="btn-edit btn-edit-insumo" data-id="${insumo.id}" title="Editar Insumo"><i class="mdi mdi-pencil"></i></button>
                    <button class="btn-delete btn-delete-insumo" data-id="${insumo.id}" title="Eliminar Insumo"><i class="mdi mdi-delete"></i></button>
                </td>
            `;
            productTableBody.appendChild(row);
        });

        // --- Asignar Eventos a Botones de Acción (después de renderizar) ---
        document.querySelectorAll('.btn-edit-insumo').forEach(button => {
            button.addEventListener('click', (e) => {
                const id = e.currentTarget.dataset.id;
                const insumoToEdit = currentInsumosData.find(i => i.id === id);
                if (insumoToEdit) {
                    openModal('edit-insumo', insumoToEdit);
                }
            });
        });

        document.querySelectorAll('.btn-delete-insumo').forEach(button => {
            button.addEventListener('click', (e) => {
                const id = e.currentTarget.dataset.id;
                deleteInsumo(id);
            });
        });

        document.querySelectorAll('.btn-add-lote').forEach(button => {
            button.addEventListener('click', (e) => {
                const insumoId = e.currentTarget.dataset.insumoId;
                const insumo = currentInsumosData.find(i => i.id === insumoId);
                if (insumo) {
                    openModal('add-lote', insumo);
                }
            });
        });

        document.querySelectorAll('.btn-edit-lote').forEach(button => {
            button.addEventListener('click', (e) => {
                const insumoId = e.currentTarget.dataset.insumoId;
                const loteId = e.currentTarget.dataset.loteId;
                const insumo = currentInsumosData.find(i => i.id === insumoId);
                const lote = insumo ? insumo.lotes.find(l => l.id === loteId) : null;
                if (insumo && lote) {
                    openModal('edit-lote', insumo, lote);
                }
            });
        });

        document.querySelectorAll('.btn-delete-lote').forEach(button => {
            button.addEventListener('click', (e) => {
                const insumoId = e.currentTarget.dataset.insumoId;
                const loteId = e.currentTarget.dataset.loteId;
                deleteLote(insumoId, loteId);
            });
        });
    }

    // --- Carga de Insumos desde Firestore en Tiempo Real ---
    async function loadInsumosRealtime() {
        if (!currentUserUid) return;

        // Listener en tiempo real para los insumos principales
        db.collection('users').doc(currentUserUid)
          .collection('insumos')
          .orderBy('createdAt', 'desc') // Ordenar por fecha de creación
          .onSnapshot(async (insumoSnapshot) => {
            const fetchedInsumos = [];
            for (const insumoDoc of insumoSnapshot.docs) {
                const insumoData = { id: insumoDoc.id, ...insumoDoc.data() };
                insumoData.lotes = []; // Inicializar lotes vacíos

                // Cargar los lotes de cada insumo
                const lotesSnapshot = await db.collection('users').doc(currentUserUid)
                                                .collection('insumos').doc(insumoDoc.id)
                                                .collection('lotes')
                                                .orderBy('fechaCaducidad', 'asc') // Ordenar lotes por fecha de caducidad
                                                .get();
                lotesSnapshot.forEach(loteDoc => {
                    insumoData.lotes.push({ id: loteDoc.id, ...loteDoc.data() });
                });
                fetchedInsumos.push(insumoData);
            }
            currentInsumosData = fetchedInsumos; // Actualizar los datos en memoria
            renderTable(currentInsumosData); // Renderizar la tabla con los datos completos
        }, error => {
            console.error("Error al escuchar insumos:", error);
            alert("Error al cargar insumos: " + error.message);
        });
    }


    // --- Funciones de Eliminación (con Firestore) ---
    async function deleteInsumo(id) {
        if (!currentUserUid) {
            alert('Debe iniciar sesión para realizar esta operación.');
            return;
        }
        if (confirm('¿Estás seguro de que quieres eliminar este insumo y todos sus lotes asociados? Esta acción es irreversible.')) {
            try {
                // Eliminar insumo y sus subcolecciones (lotes)
                // Esto es más complejo en Firestore. Una forma segura es con Netlify Function
                // o un loop que borre cada lote primero.
                const insumoRef = db.collection('users').doc(currentUserUid).collection('insumos').doc(id);

                // 1. Eliminar todos los lotes de la subcolección
                const lotesToDelete = await insumoRef.collection('lotes').get();
                const batch = db.batch(); // Usar batch para eliminaciones atómicas
                lotesToDelete.docs.forEach(doc => {
                    batch.delete(doc.ref);
                });
                await batch.commit(); // Eliminar todos los lotes en un batch

                // 2. Eliminar el documento del insumo principal
                await insumoRef.delete();
                alert('Insumo y lotes eliminados exitosamente.');
                // La tabla se actualizará automáticamente gracias al onSnapshot
            } catch (error) {
                console.error('Error al eliminar insumo:', error);
                alert('Error al eliminar insumo: ' + error.message);
            }
        }
    }

    async function deleteLote(insumoId, loteId) {
        if (!currentUserUid) {
            alert('Debe iniciar sesión para realizar esta operación.');
            return;
        }
        if (confirm('¿Estás seguro de que quieres eliminar este lote?')) {
            try {
                await db.collection('users').doc(currentUserUid)
                        .collection('insumos').doc(insumoId)
                        .collection('lotes').doc(loteId).delete();
                alert('Lote eliminado exitosamente.');
                // La tabla se actualizará automáticamente gracias al onSnapshot
            } catch (error) {
                console.error('Error al eliminar lote:', error);
                alert('Error al eliminar lote: ' + error.message);
            }
        }
    }

    // --- Funcionalidad de Búsqueda ---
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase().trim();
        const filteredInsumos = currentInsumosData.filter(insumo =>
            insumo.nombre.toLowerCase().includes(searchTerm) ||
            (insumo.lotes && insumo.lotes.some(lote => lote.numeroLote.toLowerCase().includes(searchTerm)))
        );
        renderTable(filteredInsumos);
    });

    // --- Inicialización (se iniciará la carga de insumos una vez que el usuario se autentique) ---
});
