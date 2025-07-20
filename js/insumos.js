// Funciones para gestión de insumos y lotes

// Cargar insumos y lotes
async function loadInsumosYLotes(container) {
    if (!container) return;
    
    toggleLoader(true, 'Cargando insumos...');
    
    try {
        const insumosSnapshot = await db.collection('insumos').orderBy('nombre').get();
        
        if (insumosSnapshot.empty) {
            container.innerHTML = `
                <div class="no-data">
                    <span class="material-symbols-outlined">inventory_2</span>
                    <p>No hay insumos registrados</p>
                    <button id="btn-nuevo-insumo" class="btn btn-primary">
                        <span class="material-symbols-outlined">add_box</span> Agregar Insumo
                    </button>
                </div>
            `;
            
            document.getElementById('btn-nuevo-insumo')?.addEventListener('click', () => {
                openInsumoModal();
            });
            
            toggleLoader(false);
            return;
        }
        
        let tableHtml = `
            <div class="table-controls">
                <div class="search-container">
                    <span class="material-symbols-outlined search-icon">search</span>
                    <input type="search" id="searchInput" placeholder="Buscar insumo..." autocomplete="off">
                </div>
                <button id="btnAddProduct" class="btn btn-primary">
                    <span class="material-symbols-outlined">add_box</span> Agregar Insumo
                </button>
            </div>
            
            <table class="users-table" id="tableProducts">
                <thead>
                    <tr>
                        <th><input type="checkbox" id="selectAllCheckbox" title="Seleccionar todo"></th>
                        <th>Nombre Insumo</th>
                        <th>Existencia Total</th>
                        <th>Stock Mínimo</th>
                        <th>Estado</th>
                        <th>Acciones</th>
                    </tr>
                </thead>
                <tbody>
        `;
        
        for (const insumoDoc of insumosSnapshot.docs) {
            const insumo = { id: insumoDoc.id, ...insumoDoc.data() };
            
            // Obtener lotes del insumo
            const lotesSnapshot = await db.collection('lotes')
                .where('insumo_id', '==', insumo.id)
                .get();
            
            const lotes = lotesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            
            // Determinar estado
            let estadoHtml = '';
            if (insumo.existencia_total === 0) {
                estadoHtml = '<span class="status-indicator status-critical"></span>Agotado';
            } else if (insumo.existencia_total <= insumo.stock_minimo * 0.3) {
                estadoHtml = '<span class="status-indicator status-critical"></span>Crítico';
            } else if (insumo.existencia_total <= insumo.stock_minimo) {
                estadoHtml = '<span class="status-indicator status-low"></span>Bajo';
            } else {
                estadoHtml = '<span class="status-indicator status-ok"></span>Normal';
            }
            
            // Agregar fila del insumo
            tableHtml += `
                <tr class="insumo-row" data-insumo-id="${insumo.id}">
                    <td><input type="checkbox" class="insumo-checkbox" data-id="${insumo.id}"></td>
                    <td><strong>${insumo.nombre}</strong></td>
                    <td>${insumo.existencia_total || 0}</td>
                    <td>${insumo.stock_minimo}</td>
                    <td>${estadoHtml}</td>
                    <td class="action-buttons">
                        <button class="btn btn-edit" data-action="edit-insumo" data-id="${insumo.id}">
                            <span class="material-symbols-outlined" style="font-size: 1.1rem;">edit</span> Editar
                        </button>
                        <button class="btn btn-delete" data-action="delete-insumo" data-id="${insumo.id}">
                            <span class="material-symbols-outlined" style="font-size: 1.1rem;">delete</span> Eliminar
                        </button>
                    </td>
                </tr>
            `;
            
            // Agregar filas de lotes si existen
            if (lotes.length > 0) {
                tableHtml += `
                    <tr class="lote-row" data-lote-for="${insumo.id}" style="display:none;">
                        <td colspan="6">
                            <table style="width: 100%; background: var(--background-light); border-radius: 8px; overflow: hidden;">
                                <thead>
                                    <tr>
                                        <th>Lote</th>
                                        <th>Caducidad</th>
                                        <th>Existencia</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                `;
                
                lotes.forEach(lote => {
                    const fechaCaducidad = lote.fecha_caducidad || 'N/A';
                    
                    tableHtml += `
                        <tr>
                            <td>${lote.lote || 'N/A'}</td>
                            <td>${fechaCaducidad}</td>
                            <td>${lote.existencia}</td>
                            <td class="action-buttons">
                                <button class="btn btn-edit" data-action="edit-lote" data-id="${lote.id}" data-insumo-id="${insumo.id}">
                                    <span class="material-symbols-outlined" style="font-size: 1.1rem;">edit</span> Editar
                                </button>
                                <button class="btn btn-delete" data-action="delete-lote" data-id="${lote.id}">
                                    <span class="material-symbols-outlined" style="font-size: 1.1rem;">delete</span> Eliminar
                                </button>
                            </td>
                        </tr>
                    `;
                });
                
                tableHtml += `
                                </tbody>
                            </table>
                        </td>
                    </tr>
                `;
            }
        }
        
        tableHtml += `
                </tbody>
            </table>
            <div id="deleteSelectedContainer" style="display: none; margin-top: 15px;">
                <button id="btnDeleteSelected" class="btn btn-danger">
                    <span class="material-symbols-outlined">delete_sweep</span> Eliminar Seleccionados
                </button>
            </div>
        `;
        
        container.innerHTML = tableHtml;
        
        // Configurar eventos
        setupInsumoEventListeners();
        
        toggleLoader(false);
    } catch (error) {
        console.error("Error cargando insumos:", error);
        showNotification("Error", "Error al cargar los insumos.", "error");
        
        container.innerHTML = `
            <div class="error-message">
                <span class="material-symbols-outlined">error</span>
                <p>Error al cargar los datos: ${error.message}</p>
            </div>
        `;
        
        toggleLoader(false);
    }
}

// Configurar eventos de la tabla de insumos
function setupInsumoEventListeners() {
    // Evento para expandir/colapsar lotes
    document.querySelectorAll('.insumo-row').forEach(row => {
        row.addEventListener('click', (e) => {
            if (!e.target.closest('button') && !e.target.closest('input[type="checkbox"]')) {
                const insumoId = row.getAttribute('data-insumo-id');
                const loteRow = document.querySelector(`tr[data-lote-for="${insumoId}"]`);
                
                if (loteRow) {
                    loteRow.style.display = loteRow.style.display === 'none' ? 'table-row' : 'none';
                }
            }
        });
    });
    
    // Evento para agregar insumo
    document.getElementById('btnAddProduct')?.addEventListener('click', () => {
        openInsumoModal();
    });
    
    // Eventos para botones de acción
    document.querySelectorAll('[data-action]').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const action = btn.getAttribute('data-action');
            const id = btn.getAttribute('data-id');
            const insumoId = btn.getAttribute('data-insumo-id');
            
            if (action === 'edit-insumo') {
                openInsumoModal(id);
            } else if (action === 'edit-lote') {
                openLoteModal(id, insumoId);
            } else if (action === 'delete-insumo') {
                deleteInsumo(id);
            } else if (action === 'delete-lote') {
                deleteLote(id, insumoId);
            }
        });
    });
    
    // Búsqueda
    document.getElementById('searchInput')?.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase();
        
        document.querySelectorAll('.insumo-row').forEach(row => {
            const nombre = row.querySelector('td:nth-child(2)').textContent.toLowerCase();
            const visible = nombre.includes(searchTerm);
            
            row.style.display = visible ? '' : 'none';
            
            // Ocultar lotes si se oculta el insumo
            const insumoId = row.getAttribute('data-insumo-id');
            const loteRow = document.querySelector(`tr[data-lote-for="${insumoId}"]`);
            
            if (loteRow) {
                loteRow.style.display = 'none';
            }
        });
    });
    
    // Selección de insumos
    const selectAllCheckbox = document.getElementById('selectAllCheckbox');
    
    if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener('change', () => {
            const isChecked = selectAllCheckbox.checked;
            
            document.querySelectorAll('.insumo-checkbox').forEach(checkbox => {
                checkbox.checked = isChecked;
            });
            
            updateDeleteSelectedButton();
        });
    }
    
    document.querySelectorAll('.insumo-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            updateDeleteSelectedButton();
        });
    });
    
    document.getElementById('btnDeleteSelected')?.addEventListener('click', () => {
        deleteSelectedInsumos();
    });
}

// Actualizar botón de eliminar seleccionados
function updateDeleteSelectedButton() {
    const selectedCheckboxes = document.querySelectorAll('.insumo-checkbox:checked');
    const deleteSelectedContainer = document.getElementById('deleteSelectedContainer');
    
    if (deleteSelectedContainer) {
        deleteSelectedContainer.style.display = selectedCheckboxes.length > 0 ? 'block' : 'none';
    }
}

// Abrir modal de insumo
function openInsumoModal(insumoId = null) {
    // Implementación del modal para crear/editar insumo
}

// Abrir modal de lote
function openLoteModal(loteId, insumoId) {
    // Implementación del modal para crear/editar lote
}

// Eliminar insumo
function deleteInsumo(insumoId) {
    // Implementación para eliminar insumo
}

// Eliminar lote
function deleteLote(loteId, insumoId) {
    // Implementación para eliminar lote
}

// Eliminar insumos seleccionados
function deleteSelectedInsumos() {
    // Implementación para eliminar insumos seleccionados
}