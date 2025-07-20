// Variables globales
let movimientosData = [];
let insumosData = [];
let currentFilters = {
    search: '',
    tipo: '',
    fecha: '',
    insumo: ''
};

// Inicialización cuando se carga la página
document.addEventListener('DOMContentLoaded', () => {
    // Cargar insumos para el selector
    loadInsumos();
    
    // Cargar movimientos
    loadMovimientos();
    
    // Inicializar eventos
    initEvents();
});

// Cargar insumos desde Firestore
function loadInsumos() {
    const insumoSelector = document.getElementById('filter-insumo');
    if (!insumoSelector) return;
    
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
                    
                    // Agregar opción al selector
                    const option = document.createElement('option');
                    option.value = doc.id;
                    option.textContent = insumo.nombre;
                    insumoSelector.appendChild(option);
                });
            }
        })
        .catch(error => {
            console.error("Error al cargar insumos:", error);
            showNotification('Error', 'No se pudieron cargar los insumos para el filtro', 'error');
        });
}

// Cargar movimientos desde Firestore
function loadMovimientos() {
    const movimientosList = document.getElementById('movimientos-list');
    if (!movimientosList) return;
    
    movimientosList.innerHTML = '<tr><td colspan="7" class="loading-cell">Cargando movimientos...</td></tr>';
    
    db.collection('movimientos')
        .orderBy('fecha', 'desc')
        .limit(100) // Limitar a 100 movimientos por rendimiento
        .get()
        .then(snapshot => {
            movimientosData = [];
            
            if (snapshot.empty) {
                movimientosList.innerHTML = '<tr><td colspan="7" class="empty-message">No hay movimientos registrados</td></tr>';
                return;
            }
            
            const promesas = [];
            
            snapshot.forEach(doc => {
                const movimiento = doc.data();
                movimiento.id = doc.id;
                
                // Cargar datos del insumo relacionado
                if (movimiento.insumoId) {
                    const promesa = db.collection('insumos').doc(movimiento.insumoId).get()
                        .then(insumoDoc => {
                            if (insumoDoc.exists) {
                                movimiento.insumo = insumoDoc.data();
                            }
                            return movimiento;
                        })
                        .catch(error => {
                            console.error("Error al cargar insumo del movimiento:", error);
                            movimiento.insumo = { nombre: 'Insumo no encontrado' };
                            return movimiento;
                        });
                    
                    promesas.push(promesa);
                } else {
                    movimiento.insumo = { nombre: 'No especificado' };
                    promesas.push(Promise.resolve(movimiento));
                }
            });
            
            Promise.all(promesas)
                .then(resultados => {
                    movimientosData = resultados;
                    filterAndDisplayMovimientos();
                });
        })
        .catch(error => {
            console.error("Error al cargar movimientos:", error);
            movimientosList.innerHTML = `<tr><td colspan="7" class="error-message">Error al cargar movimientos: ${error.message}</td></tr>`;
            showNotification('Error', 'No se pudieron cargar los movimientos', 'error');
        });
}

// Filtrar y mostrar movimientos
function filterAndDisplayMovimientos() {
    const movimientosList = document.getElementById('movimientos-list');
    if (!movimientosList) return;
    
    // Aplicar filtros
    let filteredMovimientos = movimientosData;
    
    if (currentFilters.search) {
        const searchTerm = currentFilters.search.toLowerCase();
        filteredMovimientos = filteredMovimientos.filter(movimiento => 
            movimiento.insumo?.nombre.toLowerCase().includes(searchTerm) ||
            movimiento.usuario?.toLowerCase().includes(searchTerm) ||
            movimiento.observaciones?.toLowerCase().includes(searchTerm)
        );
    }
    
    if (currentFilters.tipo) {
        filteredMovimientos = filteredMovimientos.filter(movimiento => 
            movimiento.tipo === currentFilters.tipo
        );
    }
    
    if (currentFilters.fecha) {
        const fechaFiltro = new Date(currentFilters.fecha);
        fechaFiltro.setHours(0, 0, 0, 0);
        
        filteredMovimientos = filteredMovimientos.filter(movimiento => {
            if (movimiento.fecha) {
                const fechaMovimiento = movimiento.fecha.toDate();
                fechaMovimiento.setHours(0, 0, 0, 0);
                return fechaMovimiento.getTime() === fechaFiltro.getTime();
            }
            return false;
        });
    }
    
    if (currentFilters.insumo) {
        filteredMovimientos = filteredMovimientos.filter(movimiento => 
            movimiento.insumoId === currentFilters.insumo
        );
    }
    
    // Mostrar resultados
    if (filteredMovimientos.length === 0) {
        movimientosList.innerHTML = '<tr><td colspan="7" class="empty-message">No se encontraron movimientos con los filtros aplicados</td></tr>';
        return;
    }
    
    movimientosList.innerHTML = '';
    filteredMovimientos.forEach(movimiento => {
        const row = document.createElement('tr');
        
        // Formatear fecha
        let fechaFormateada = 'No disponible';
        if (movimiento.fecha) {
            const fecha = movimiento.fecha.toDate();
            fechaFormateada = fecha.toLocaleDateString('es-ES') + ' ' + fecha.toLocaleTimeString('es-ES', {hour: '2-digit', minute: '2-digit'});
        }