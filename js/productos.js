// Variables globales
let productosData = [];
let currentFilters = {
    search: '',
    categoria: '',
    estado: ''
};

// Inicialización cuando se carga la página
document.addEventListener('DOMContentLoaded', () => {
    // Cargar productos
    loadProductos();
    
    // Inicializar eventos
    initEvents();
});

// Cargar productos desde Firestore
function loadProductos() {
    const productosList = document.getElementById('productos-list');
    if (!productosList) return;
    
    productosList.innerHTML = '<tr><td colspan="7" class="loading-cell">Cargando productos...</td></tr>';
    
    db.collection('productos')
        .orderBy('nombre')
        .get()
        .then(snapshot => {
            productosData = [];
            
            if (snapshot.empty) {
                productosList.innerHTML = '<tr><td colspan="7" class="empty-message">No hay productos registrados</td></tr>';
                return;
            }
            
            snapshot.forEach(doc => {
                const producto = doc.data();
                producto.id = doc.id;
                productosData.push(producto);
            });
            
            // Aplicar filtros iniciales y mostrar
            filterAndDisplayProductos();
        })
        .catch(error => {
            console.error("Error al cargar productos:", error);
            productosList.innerHTML = `<tr><td colspan="7" class="error-message">Error al cargar productos: ${error.message}</td></tr>`;
            showNotification('Error', 'No se pudieron cargar los productos', 'error');
        });
}

// Filtrar y mostrar productos
function filterAndDisplayProductos() {
    const productosList = document.getElementById('productos-list');
    if (!productosList) return;
    
    // Aplicar filtros
    let filteredProductos = productosData;
    
    if (currentFilters.search) {
        const searchTerm = currentFilters.search.toLowerCase();
        filteredProductos = filteredProductos.filter(producto => 
            producto.nombre.toLowerCase().includes(searchTerm) ||
            producto.codigo?.toLowerCase().includes(searchTerm) ||
            producto.descripcion?.toLowerCase().includes(searchTerm)
        );
    }
    
    if (currentFilters.categoria) {
        filteredProductos = filteredProductos.filter(producto => 
            producto.categoria === currentFilters.categoria
        );
    }
    
    if (currentFilters.estado) {
        filteredProductos = filteredProductos.filter(producto => {
            if (currentFilters.estado === 'activo') {
                return producto.estado === 'activo';
            } else if (currentFilters.estado === 'inactivo') {
                return producto.estado === 'inactivo';
            }
            return true;
        });
    }
    
    // Mostrar resultados
    if (filteredProductos.length === 0) {
        productosList.innerHTML = '<tr><td colspan="7" class="empty-message">No se encontraron productos con los filtros aplicados</td></tr>';
        return;
    }
    
    productosList.innerHTML = '';
    filteredProductos.forEach(producto => {
        const row = document.createElement('tr');
        
        // Determinar estado
        let estadoClass = producto.estado === 'activo' ? 'status-active' : 'status-inactive';
        let estadoLabel = producto.estado === 'activo' ? 'Activo' : 'Inactivo';
        
        row.innerHTML = `
            <td>${producto.codigo || '-'}</td>
            <td>${producto.nombre || ''}</td>
            <td>${producto.categoria || '-'}</td>
            <td>${producto.precio ? formatCurrency(producto.precio) : '-'}</td>
            <td>
                <div class="status-badge ${estadoClass}">
                    ${estadoLabel}
                </div>
            </td>
            <td>${producto.stock || '0'}</td>
            <td class="actions-cell">
                <button class="action-btn view-btn" onclick="viewProducto('${producto.id}')" title="Ver detalles">
                    <i class="mdi mdi-eye-outline"></i>
                </button>
                <button class="action-btn edit-btn" onclick="editProducto('${producto.id}')" title="Editar">
                    <i class="mdi mdi-pencil-outline"></i>
                </button>
                <button class="action-btn delete-btn" onclick="deleteProducto('${producto.id}')" title="Eliminar">
                    <i class="mdi mdi-delete-outline"></i>
                </button>
            </td>
        `;
        productosList.appendChild(row);
    });
    
    // Actualizar contador
    const countElement = document.getElementById('productos-count');
    if (countElement) {
        countElement.textContent = filteredProductos.length;
    }
}

// Formatear moneda
function formatCurrency(value) {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0
    }).format(value);
}

// Inicializar eventos
function initEvents() {
    // Botón para agregar producto
    const addBtn = document.getElementById('add-producto-btn');
    if (addBtn) {
        addBtn.addEventListener('click', () => showProductoForm());
    }
    
    // Búsqueda
    const searchInput = document.getElementById('search-productos');
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            currentFilters.search = searchInput.value;
            filterAndDisplayProductos();
        });
    }
    
    // Filtro de categoría
    const categoriaFilter = document.getElementById('filter-categoria');
    if (categoriaFilter) {
        categoriaFilter.addEventListener('change', () => {
            currentFilters.categoria = categoriaFilter.value;
            filterAndDisplayProductos();
        });
    }
    
    // Filtro de estado
    const estadoFilter = document.getElementById('filter-estado');
    if (estadoFilter) {
        estadoFilter.addEventListener('change', () => {
            currentFilters.estado = estadoFilter.value;
            filterAndDisplayProductos();
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
            
            filterAndDisplayProductos();
        });
    }
}

// Mostrar formulario de producto (para agregar o editar)
function showProductoForm(productoId = null) {
    // Título del modal
    const modalTitle = productoId ? 'Editar Producto' : 'Agregar Nuevo Producto';
    
    // Crear modal
    const modalHTML = `
        <div class="modal-overlay" id="producto-modal">
            <div class="modal-container">
                <div class="modal-header">
                    <h3>${modalTitle}</h3>
                    <button class="modal-close-btn" id="close-modal">
                        <i class="mdi mdi-close"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <form id="producto-form">
                        <input type="hidden" id="producto-id" value="${productoId || ''}">
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="producto-codigo">Código</label>
                                <input type="text" id="producto-codigo" placeholder="Código único">
                            </div>
                            
                            <div class="form-group">
                                <label for="producto-nombre">Nombre *</label>
                                <input type="text" id="producto-nombre" required placeholder="Nombre del producto">
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="producto-categoria">Categoría *</label>
                                <select id="producto-categoria" required>
                                    <option value="">Seleccione una categoría</option>
                                    <option value="Reactivos">Reactivos</option>
                                    <option value="Kits">Kits</option>
                                    <option value="Equipos">Equipos</option>
                                    <option value="Consumibles">Consumibles</option>
                                    <option value="Servicios">Servicios</option>
                                    <option value="Otros">Otros</option>
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label for="producto-estado">Estado *</label>
                                <select id="producto-estado" required>
                                    <option value="activo">Activo</option>
                                    <option value="inactivo">Inactivo</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="producto-precio">Precio</label>
                                <div class="input-prefix">
                                    <span>$</span>
                                    <input type="number" id="producto-precio" min="0" step="1000" placeholder="Precio de venta">
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label for="producto-stock">Stock</label>
                                <input type="number" id="producto-stock" min="0" placeholder="Cantidad disponible">
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label for="producto-descripcion">Descripción</label>
                            <textarea id="producto-descripcion" rows="3" placeholder="Descripción detallada del producto"></textarea>
                        </div>
                        
                        <div class="form-group">
                            <label for="producto-notas">Notas adicionales</label>
                            <textarea id="producto-notas" rows="2" placeholder="Notas internas"></textarea>
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
    document.getElementById('producto-form').addEventListener('submit', saveProducto);
    
    // Si es edición, cargar datos del producto
    if (productoId) {
        const producto = productosData.find(p => p.id === productoId);
        
        if (producto) {
            document.getElementById('producto-codigo').value = producto.codigo || '';
            document.getElementById('producto-nombre').value = producto.nombre || '';
            document.getElementById('producto-categoria').value = producto.categoria || '';
            document.getElementById('producto-estado').value = producto.estado || 'activo';
            document.getElementById('producto-precio').value = producto.precio || '';
            document.getElementById('producto-stock').value = producto.stock || '';
            document.getElementById('producto-descripcion').value = producto.descripcion || '';
            document.getElementById('producto-notas').value = producto.notas || '';
        }
    }
}

// Cerrar modal
function closeModal() {
    const modal = document.querySelector('.modal-overlay');
    if (modal) {
        modal.classList.add('closing');
        setTimeout(() => {
            modal.remove();
        }, 300);
    }
}

// Guardar producto
function saveProducto(e) {
    e.preventDefault();
    
    const productoId = document.getElementById('producto-id').value;
    const productoData = {
        codigo: document.getElementById('producto-codigo').value,
        nombre: document.getElementById('producto-nombre').value,
        categoria: document.getElementById('producto-categoria').value,
        estado: document.getElementById('producto-estado').value,
        precio: document.getElementById('producto-precio').value ? parseFloat(document.getElementById('producto-precio').value) : null,
        stock: document.getElementById('producto-stock').value ? parseInt(document.getElementById('producto-stock').value) : 0,
        descripcion: document.getElementById('producto-descripcion').value,
        notas: document.getElementById('producto-notas').value,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    // Guardar en Firestore
    let savePromise;
    
    if (productoId) {
        // Actualizar producto existente
        savePromise = db.collection('productos').doc(productoId).update(productoData);
    } else {
        // Crear nuevo producto
        productoData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
        productoData.createdBy = auth.currentUser.uid;
        savePromise = db.collection('productos').add(productoData);
    }
    
    savePromise
        .then(() => {
            closeModal();
            loadProductos();
            showNotification(
                productoId ? 'Producto actualizado' : 'Producto agregado',
                `El producto "${productoData.nombre}" ha sido ${productoId ? 'actualizado' : 'agregado'} correctamente.`,
                'success'
            );
        })
        .catch(error => {
            console.error("Error al guardar producto:", error);
            showNotification('Error', `No se pudo ${productoId ? 'actualizar' : 'agregar'} el producto: ${error.message}`, 'error');
        });
}

// Ver detalles de producto
function viewProducto(productoId) {
    const producto = productosData.find(p => p.id === productoId);
    
    if (!producto) {
        showNotification('Error', 'Producto no encontrado', 'error');
        return;
    }
    
    // Determinar estado
    let estadoClass = producto.estado === 'activo' ? 'status-active' : 'status-inactive';
    let estadoLabel = producto.estado === 'activo' ? 'Activo' : 'Inactivo';
    
    // Crear modal
    const modalHTML = `
        <div class="modal-overlay" id="producto-details-modal">
            <div class="modal-container">
                <div class="modal-header">
                    <h3>Detalles del Producto</h3>
                    <button class="modal-close-btn" id="close-modal">
                        <i class="mdi mdi-close"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="producto-details">
                        <div class="producto-details-header">
                            <h2>${producto.nombre}</h2>
                            <div class="status-badge ${estadoClass}">
                                ${estadoLabel}
                            </div>
                        </div>
                        
                        <div class="details-section">
                            <h4>Información General</h4>
                            <div class="details-grid">
                                <div class="details-item">
                                    <div class="details-label">Código</div>
                                    <div class="details-value">${producto.codigo || 'No especificado'}</div>
                                </div>
                                <div class="details-item">
                                    <div class="details-label">Categoría</div>
                                    <div class="details-value">${producto.categoria || 'No especificada'}</div>
                                </div>
                                <div class="details-item">
                                    <div class="details-label">Precio</div>
                                    <div class="details-value">${producto.precio ? formatCurrency(producto.precio) : 'No especificado'}</div>
                                </div>
                                <div class="details-item">
                                    <div class="details-label">Stock</div>
                                    <div class="details-value">${producto.stock || '0'}</div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="details-section">
                            <h4>Descripción</h4>
                            <p>${producto.descripcion || 'No hay descripción disponible.'}</p>
                        </div>
                        
                        <div class="details-section">
                            <h4>Notas Adicionales</h4>
                            <p>${producto.notas || 'No hay notas adicionales.'}</p>
                        </div>
                    </div>
                    
                    <div class="modal-actions">
                        <button class="btn-secondary" id="close-details">Cerrar</button>
                        <button class="btn-primary" onclick="editProducto('${producto.id}')">Editar</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Agregar modal al DOM
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Configurar eventos del modal
    document.getElementById('close-modal').addEventListener('click', closeModal);
    document.getElementById('close-details').addEventListener('click', closeModal);
}

// Editar producto
function editProducto(productoId) {
    // Cerrar modal de detalles si está abierto
    closeModal();
    
    // Mostrar formulario de edición
    showProductoForm(productoId);
}

// Eliminar producto
function deleteProducto(productoId) {
    const producto = productosData.find(p => p.id === productoId);
    
    if (!producto) {
        showNotification('Error', 'Producto no encontrado', 'error');
        return;
    }
    
    // Confirmar eliminación
    if (confirm(`¿Está seguro que desea eliminar el producto "${producto.nombre}"? Esta acción no se puede deshacer.`)) {
        db.collection('productos').doc(productoId).delete()
            .then(() => {
                loadProductos();
                showNotification('Producto eliminado', `El producto "${producto.nombre}" ha sido eliminado correctamente.`, 'success');
            })
            .catch(error => {
                console.error("Error al eliminar producto:", error);
                showNotification('Error', `No se pudo eliminar el producto: ${error.message}`, 'error');
            });
    }
}
