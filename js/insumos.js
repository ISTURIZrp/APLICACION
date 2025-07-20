// Variables globales
let insumosData = [];
let currentFilters = {
    search: '',
    categoria: '',
    estado: ''
};

// Inicialización cuando se carga la página
document.addEventListener('DOMContentLoaded', () => {
    // Cargar insumos
    loadInsumos();
    
    // Inicializar eventos
    initEvents();
});

// Cargar insumos desde Firestore
function loadInsumos() {
    const insumosList = document.getElementById('insumos-list');
    if (!insumosList) return;
    
    insumosList.innerHTML = '<tr><td colspan="7" class="loading-cell">Cargando insumos...</td></tr>';
    
    db.collection('insumos')
        .orderBy('nombre')
        .get()
        .then(snapshot => {
            insumosData = [];
            
            if (snapshot.empty) {
                insumosList.innerHTML = '<tr><td colspan="7" class="empty-message">No hay insumos registrados</td></tr>';
                return;
            }
            
            snapshot.forEach(doc => {
                const insumo = doc.data();
                insumo.id = doc.id;
                insumosData.push(insumo);
            });
            
            // Aplicar filtros iniciales y mostrar
            filterAndDisplayInsumos();
        })
        .catch(error => {
            console.error("Error al cargar insumos:", error);
            insumosList.innerHTML = `<tr><td colspan="7" class="error-message">Error al cargar insumos: ${error.message}</td></tr>`;
            showNotification('Error', 'No se pudieron cargar los insumos', 'error');
        });
}

// Filtrar y mostrar insumos
function filterAndDisplayInsumos() {
    const insumosList = document.getElementById('insumos-list');
    if (!insumosList) return;
    
    // Aplicar filtros
    let filteredInsumos = insumosData;
    
    if (currentFilters.search) {
        const searchTerm = currentFilters.search.toLowerCase();
        filteredInsumos = filteredInsumos.filter(insumo => 
            insumo.nombre.toLowerCase().includes(searchTerm) ||
            insumo.codigo?.toLowerCase().includes(searchTerm) ||
            insumo.proveedor?.toLowerCase().includes(searchTerm)
        );
    }
    
    if (currentFilters.categoria) {
        filteredInsumos = filteredInsumos.filter(insumo => 
            insumo.categoria === currentFilters.categoria
        );
    }
    
    if (currentFilters.estado) {
        filteredInsumos = filteredInsumos.filter(insumo => {
            if (currentFilters.estado === 'critico') {
                return insumo.cantidad <= insumo.stockMinimo;
            } else if (currentFilters.estado === 'normal') {
                return insumo.cantidad > insumo.stockMinimo;
            }
            return true;
        });
    }
    
    // Mostrar resultados
    if (filteredInsumos.length === 0) {
        insumosList.innerHTML = '<tr><td colspan="7" class="empty-message">No se encontraron insumos con los filtros aplicados</td></tr>';
        return;
    }
    
    insumosList.innerHTML = '';
    filteredInsumos.forEach(insumo => {
        const row = document.createElement('tr');
        
        // Determinar estado del stock
        let stockStatus = 'normal';
        let stockLabel = 'Normal';
        
        if (insumo.stockMinimo && insumo.cantidad <= insumo.stockMinimo) {
            stockStatus = 'critico';
            stockLabel = 'Crítico';
        }
        
        row.innerHTML = `
            <td>${insumo.codigo || '-'}</td>
            <td>${insumo.nombre || ''}</td>
            <td>${insumo.categoria || '-'}</td>
            <td>
                <div class="stock-indicator ${stockStatus}">
                    <span class="stock-value">${insumo.cantidad || 0}</span>
                    <span class="stock-unit">${insumo.unidad || 'u'}</span>
                </div>
            </td>
            <td>${insumo.ubicacion || '-'}</td>
            <td>${insumo.proveedor || '-'}</td>
            <td class="actions-cell">
                <button class="action-btn view-btn" onclick="viewInsumo('${insumo.id}')" title="Ver detalles">
                    <i class="mdi mdi-eye-outline"></i>
                </button>
                <button class="action-btn edit-btn" onclick="editInsumo('${insumo.id}')" title="Editar">
                    <i class="mdi mdi-pencil-outline"></i>
                </button>
                <button class="action-btn delete-btn" onclick="deleteInsumo('${insumo.id}')" title="Eliminar">
                    <i class="mdi mdi-delete-outline"></i>
                </button>
            </td>
        `;
        insumosList.appendChild(row);
    });
    
    // Actualizar contador
    const countElement = document.getElementById('insumos-count');
    if (countElement) {
        countElement.textContent = filteredInsumos.length;
    }
}

// Inicializar eventos
function initEvents() {
    // Botón para agregar insumo
    const addBtn = document.getElementById('add-insumo-btn');
    if (addBtn) {
        addBtn.addEventListener('click', () => showInsumoForm());
    }
    
    // Búsqueda
    const searchInput = document.getElementById('search-insumos');
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            currentFilters.search = searchInput.value;
            filterAndDisplayInsumos();
        });
    }
    
    // Filtro de categoría
    const categoriaFilter = document.getElementById('filter-categoria');
    if (categoriaFilter) {
        categoriaFilter.addEventListener('change', () => {
            currentFilters.categoria = categoriaFilter.value;
            filterAndDisplayInsumos();
        });
    }
    
    // Filtro de estado
    const estadoFilter = document.getElementById('filter-estado');
    if (estadoFilter) {
        estadoFilter.addEventListener('change', () => {
            currentFilters.estado = estadoFilter.value;
            filterAndDisplayInsumos();
        });
    }
    
    // Botón para limpiar filtros
    const clearFiltersBtn = document.getElementById('clear-filters');
    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', () => {
            currentFilters = {
                search: '',
                categoria: '',
                estado: ''
            };
            
            if (searchInput) searchInput.value = '';
            if (categoriaFilter) categoriaFilter.value = '';
            if (estadoFilter) estadoFilter.value = '';
            
            filterAndDisplayInsumos();
        });
    }
}

// Mostrar formulario de insumo (para agregar o editar)
function showInsumoForm(insumoId = null) {
    // Título del modal
    const modalTitle = insumoId ? 'Editar Insumo' : 'Agregar Nuevo Insumo';
    
    // Crear modal
    const modalHTML = `
        <div class="modal-overlay" id="insumo-modal">
            <div class="modal-container">
                <div class="modal-header">
                    <h3>${modalTitle}</h3>
                    <button class="modal-close-btn" id="close-modal">
                        <i class="mdi mdi-close"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <form id="insumo-form">
                        <input type="hidden" id="insumo-id" value="${insumoId || ''}">
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="insumo-codigo">Código</label>
                                <input type="text" id="insumo-codigo" placeholder="Código único">
                            </div>
                            
                            <div class="form-group">
                                <label for="insumo-nombre">Nombre *</label>
                                <input type="text" id="insumo-nombre" required placeholder="Nombre del insumo">
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="insumo-categoria">Categoría *</label>
                                <select id="insumo-categoria" required>
                                    <option value="">Seleccione una categoría</option>
                                    <option value="Reactivos">Reactivos</option>
                                    <option value="Material de vidrio">Material de vidrio</option>
                                    <option value="Plásticos">Plásticos</option>
                                    <option value="Equipos pequeños">Equipos pequeños</option>
                                    <option value="Consumibles">Consumibles</option>
                                    <option value="Seguridad">Seguridad</option>
                                    <option value="Otros">Otros</option>
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label for="insumo-proveedor">Proveedor</label>
                                <input type="text" id="insumo-proveedor" placeholder="Proveedor principal">
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="insumo-cantidad">Cantidad *</label>
                                <input type="number" id="insumo-cantidad" min="0" step="0.01" required placeholder="Cantidad actual">
                            </div>
                            
                            <div class="form-group">
                                <label for="insumo-unidad">Unidad</label>
                                <select id="insumo-unidad">
                                    <option value="u">Unidades</option>
                                    <option value="g">Gramos</option>
                                    <option value="kg">Kilogramos</option>
                                    <option value="ml">Mililitros</option>
                                    <option value="l">Litros</option>
                                    <option value="cm">Centímetros</option>
                                    <option value="m">Metros</option>
                                    <option value="paq">Paquetes</option>
                                    <option value="caja">Cajas</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="insumo-stock-minimo">Stock Mínimo</label>
                                <input type="number" id="insumo-stock-minimo" min="0" step="0.01" placeholder="Cantidad mínima requerida">
                            </div>
                            
                            <div class="form-group">
                                <label for="insumo-ubicacion">Ubicación</label>
                                <input type="text" id="insumo-ubicacion" placeholder="Ubicación en almacén">
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label for="insumo-descripcion">Descripción</label>
                            <textarea id="insumo-descripcion" rows="3" placeholder="Descripción detallada del insumo"></textarea>
                        </div>
                        
                        <div class="form-actions">
                            <button type="button" class="btn-secondary" id="cancel-form">Cancelar</button>
                            <button type="submit" class="btn-primary">Guardar</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    `;
    
    // Agregar modal al DOM
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Configurar eventos del modal
    document.getElementById('close-modal').addEventListener('click', closeModal);
    document.getElementById('cancel-form').addEventListener('click', closeModal);
    document.getElementById('insumo-form').addEventListener('submit', saveInsumo);
    
    // Si es edición, cargar datos del insumo
    if (insumoId) {
        const insumo = insumosData.find(i => i.id === insumoId);
        
        if (insumo) {
            document.getElementById('insumo-codigo').value = insumo.codigo || '';
            document.getElementById('insumo-nombre').value = insumo.nombre || '';
            document.getElementById('insumo-categoria').value = insumo.categoria || '';
            document.getElementById('insumo-proveedor').value = insumo.proveedor || '';
            document.getElementById('insumo-cantidad').value = insumo.cantidad || 0;
            document.getElementById('insumo-unidad').value = insumo.unidad || 'u';
            document.getElementById('insumo-stock-minimo').value = insumo.stockMinimo || '';
            document.getElementById('insumo-ubicacion').value = insumo.ubicacion || '';
            document.getElementById('insumo-descripcion').value = insumo.descripcion || '';
        }
    }
}

// Cerrar modal
function closeModal() {
    const modal = document.getElementById('insumo-modal');
    if (modal) {
        modal.classList.add('closing');
        setTimeout(() => {
            modal.remove();
        }, 300);
    }
}

// Guardar insumo
function saveInsumo(e) {
    e.preventDefault();
    
    const insumoId = document.getElementById('insumo-id').value;
    const insumoData = {
        codigo: document.getElementById('insumo-codigo').value,
        nombre: document.getElementById('insumo-nombre').value,
        categoria: document.getElementById('insumo-categoria').value,
        proveedor: document.getElementById('insumo-proveedor').value,
        cantidad: parseFloat(document.getElementById('insumo-cantidad').value),
        unidad: document.getElementById('insumo-unidad').value,
        stockMinimo: document.getElementById('insumo-stock-minimo').value ? parseFloat(document.getElementById('insumo-stock-minimo').value) : null,
        ubicacion: document.getElementById('insumo-ubicacion').value,
        descripcion: document.getElementById('insumo-descripcion').value,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    // Guardar en Firestore
    let savePromise;
    
    if (insumoId) {
        // Actualizar insumo existente
        savePromise = db.collection('insumos').doc(insumoId).update(insumoData);
    } else {
        // Crear nuevo insumo
        insumoData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
        insumoData.createdBy = auth.currentUser.uid;
        savePromise = db.collection('insumos').add(insumoData);
    }
    
    savePromise
        .then(() => {
            closeModal();
            loadInsumos();
            showNotification(
                insumoId ? 'Insumo actualizado' : 'Insumo agregado',
                `El insumo "${insumoData.nombre}" ha sido ${insumoId ? 'actualizado' : 'agregado'} correctamente.`,
                'success'
            );
            
            // Registrar movimiento si cambió la cantidad
            if (insumoId) {
                const originalInsumo = insumosData.find(i => i.id === insumoId);
                if (originalInsumo && originalInsumo.cantidad !== insumoData.cantidad) {
                    registerMovimiento(insumoId, originalInsumo.cantidad, insumoData.cantidad, 'ajuste');
                }
            }
        })
        .catch(error => {
            console.error("Error al guardar insumo:", error);
            showNotification('Error', `No se pudo ${insumoId ? 'actualizar' : 'agregar'} el insumo: ${error.message}`, 'error');
        });
}

// Ver detalles de insumo
function viewInsumo(insumoId) {
    const insumo = insumosData.find(i => i.id === insumoId);
    
    if (!insumo) {
        showNotification('Error', 'Insumo no encontrado', 'error');
        return;
    }
    
    // Crear modal
    const modalHTML = `
        <div class="modal-overlay" id="insumo-modal">
            <div class="modal-container">
                <div class="modal-header">
                    <h3>Detalles del Insumo</h3>
                    <button class="modal-close-btn" id="close-modal">
                        <i class="mdi mdi-close"></i>