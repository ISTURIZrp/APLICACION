// Variables globales
let pedidosData = [];
let insumosData = [];
let proveedoresData = [];
let currentFilters = {
    search: '',
    estado: '',
    proveedor: '',
    fecha: ''
};

// Inicialización cuando se carga la página
document.addEventListener('DOMContentLoaded', () => {
    // Cargar datos necesarios
    loadInsumos();
    loadProveedores();
    
    // Cargar pedidos
    loadPedidos();
    
    // Inicializar eventos
    initEvents();
});

// Cargar insumos desde Firestore
function loadInsumos() {
    db.collection('insumos')
        .orderBy('nombre')
        .get()
        .then(snapshot => {
            insumosData = [];
            
            if (!snapshot.empty) {
                snapshot.forEach(doc => {
                    const insumo = doc.data();
                    insumo.id = doc.id;
                    insumosData.push(insumo);
                });
            }
        })
        .catch(error => {
            console.error("Error al cargar insumos:", error);
        });
}

// Cargar proveedores desde Firestore
function loadProveedores() {
    const proveedorSelector = document.getElementById('filter-proveedor');
    if (!proveedorSelector) return;
    
    db.collection('proveedores')
        .orderBy('nombre')
        .get()
        .then(snapshot => {
            proveedoresData = [];
            
            if (!snapshot.empty) {
                snapshot.forEach(doc => {
                    const proveedor = doc.data();
                    proveedor.id = doc.id;
                    proveedoresData.push(proveedor);
                    
                    // Agregar opción al selector
                    const option = document.createElement('option');
                    option.value = doc.id;
                    option.textContent = proveedor.nombre;
                    proveedorSelector.appendChild(option);
                });
            }
        })
        .catch(error => {
            console.error("Error al cargar proveedores:", error);
        });
}

// Cargar pedidos desde Firestore
function loadPedidos() {
    const pedidosList = document.getElementById('pedidos-list');
    if (!pedidosList) return;
    
    pedidosList.innerHTML = '<tr><td colspan="7" class="loading-cell">Cargando pedidos...</td></tr>';
    
    db.collection('pedidos')
        .orderBy('fecha', 'desc')
        .get()
        .then(snapshot => {
            pedidosData = [];
            
            if (snapshot.empty) {
                pedidosList.innerHTML = '<tr><td colspan="7" class="empty-message">No hay pedidos registrados</td></tr>';
                return;
            }
            
            snapshot.forEach(doc => {
                const pedido = doc.data();
                pedido.id = doc.id;
                pedidosData.push(pedido);
            });
            
            // Aplicar filtros iniciales y mostrar
            filterAndDisplayPedidos();
        })
        .catch(error => {
            console.error("Error al cargar pedidos:", error);
            pedidosList.innerHTML = `<tr><td colspan="7" class="error-message">Error al cargar pedidos: ${error.message}</td></tr>`;
            showNotification('Error', 'No se pudieron cargar los pedidos', 'error');
        });
}

// Filtrar y mostrar pedidos
function filterAndDisplayPedidos() {
    const pedidosList = document.getElementById('pedidos-list');
    if (!pedidosList) return;
    
    // Aplicar filtros
    let filteredPedidos = pedidosData;
    
    if (currentFilters.search) {
        const searchTerm = currentFilters.search.toLowerCase();
        filteredPedidos = filteredPedidos.filter(pedido => 
            pedido.numero?.toLowerCase().includes(searchTerm) ||
            pedido.proveedor?.nombre?.toLowerCase().includes(searchTerm) ||
            pedido.observaciones?.toLowerCase().includes(searchTerm)
        );
    }
    
    if (currentFilters.estado) {
        filteredPedidos = filteredPedidos.filter(pedido => 
            pedido.estado === currentFilters.estado
        );
    }
    
    if (currentFilters.proveedor) {
        filteredPedidos = filteredPedidos.filter(pedido => 
            pedido.proveedorId === currentFilters.proveedor
        );
    }
    
    if (currentFilters.fecha) {
        const fechaFiltro = new Date(currentFilters.fecha);
        fechaFiltro.setHours(0, 0, 0, 0);
        
        filteredPedidos = filteredPedidos.filter(pedido => {
            if (pedido.fecha) {
                const fechaPedido = pedido.fecha.toDate();
                fechaPedido.setHours(0, 0, 0, 0);
                return fechaPedido.getTime() === fechaFiltro.getTime();
            }
            return false;
        });
    }
    
    // Mostrar resultados
    if (filteredPedidos.length === 0) {
        pedidosList.innerHTML = '<tr><td colspan="7" class="empty-message">No se encontraron pedidos con los filtros aplicados</td></tr>';
        return;
    }
    
    pedidosList.innerHTML = '';
    filteredPedidos.forEach(pedido => {
        const row = document.createElement('tr');
        
        // Formatear fecha
        let fechaFormateada = 'No disponible';
        if (pedido.fecha) {
            const fecha = pedido.fecha.toDate();
            fechaFormateada = fecha.toLocaleDateString('es-ES');
        }
        
        // Determinar estado
        let estadoClass = '';
        let estadoText = '';
        
        switch(pedido.estado) {
            case 'pendiente':
                estadoClass = 'status-pending';
                estadoText = 'Pendiente';
                break;
            case 'aprobado':
                estadoClass = 'status-approved';
                estadoText = 'Aprobado';
                break;
            case 'enviado':
                estadoClass = 'status-sent';
                estadoText = 'Enviado';
                break;
            case 'recibido':
                estadoClass = 'status-received';
                estadoText = 'Recibido';
                break;
            case 'cancelado':
                estadoClass = 'status-cancelled';
                estadoText = 'Cancelado';
                break;
            default:
                estadoClass = 'status-other';
                estadoText = pedido.estado || 'Desconocido';
        }
        
        row.innerHTML = `
            <td>${pedido.numero || '-'}</td>
            <td>${fechaFormateada}</td>
            <td>${pedido.proveedor?.nombre || 'No especificado'}</td>
            <td>
                <div class="status-badge ${estadoClass}">
                    ${estadoText}
                </div>
            </td>
            <td>${pedido.items?.length || 0} ítems</td>
            <td>${pedido.total ? formatCurrency(pedido.total) : '-'}</td>
            <td class="actions-cell">
                <button class="action-btn view-btn" onclick="viewPedido('${pedido.id}')" title="Ver detalles">
                    <i class="mdi mdi-eye-outline"></i>
                </button>
                <button class="action-btn edit-btn" onclick="editPedido('${pedido.id}')" title="Editar">
                    <i class="mdi mdi-pencil-outline"></i>
                </button>
                <button class="action-btn ${pedido.estado !== 'cancelado' ? 'delete-btn' : 'disabled-btn'}" 
                    ${pedido.estado !== 'cancelado' ? `onclick="cancelPedido('${pedido.id}')"` : 'disabled'} 
                    title="${pedido.estado !== 'cancelado' ? 'Cancelar pedido' : 'Pedido ya cancelado'}">
                    <i class="mdi mdi-close-circle-outline"></i>
                </button>
            </td>
        `;
        pedidosList.appendChild(row);
    });
    
    // Actualizar contador
    const countElement = document.getElementById('pedidos-count');
    if (countElement) {
        countElement.textContent = filteredPedidos.length;
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
    // Botón para crear pedido
    const addBtn = document.getElementById('add-pedido-btn');
    if (addBtn) {
        addBtn.addEventListener('click', () => showPedidoForm());
    }
    
    // Búsqueda
    const searchInput = document.getElementById('search-pedidos');
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            currentFilters.search = searchInput.value;
            filterAndDisplayPedidos();
        });
    }
    
    // Filtro de estado
    const estadoFilter = document.getElementById('filter-estado');
    if (estadoFilter) {
        estadoFilter.addEventListener('change', () => {
            currentFilters.estado = estadoFilter.value;
            filterAndDisplayPedidos();
        });
    }
    
    // Filtro de proveedor
    const proveedorFilter = document.getElementById('filter-proveedor');
    if (proveedorFilter) {
        proveedorFilter.addEventListener('change', () => {
            currentFilters.proveedor = proveedorFilter.value;
            filterAndDisplayPedidos();
        });
    }
    
    // Filtro de fecha
    const fechaFilter = document.getElementById('filter-fecha');
    if (fechaFilter) {
        fechaFilter.addEventListener('change', () => {
            currentFilters.fecha = fechaFilter.value;
            filterAndDisplayPedidos();
        });
    }
    
    // Botón para limpiar filtros
    const clearFiltersBtn = document.getElementById('clear-filters');
    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', () => {
            currentFilters = {
                search: '',
                estado: '',
                proveedor: '',
                fecha: ''
            };
            
            if (searchInput) searchInput.value = '';
            if (estadoFilter) estadoFilter.value = '';
            if (proveedorFilter) proveedorFilter.value = '';
            if
