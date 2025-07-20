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
        // Determinar tipo de movimiento
        let tipoClass = '';
        let tipoText = '';
        
        switch(movimiento.tipo) {
            case 'entrada':
                tipoClass = 'movement-in';
                tipoText = 'Entrada';
                break;
            case 'salida':
                tipoClass = 'movement-out';
                tipoText = 'Salida';
                break;
            case 'ajuste':
                tipoClass = 'movement-adjust';
                tipoText = 'Ajuste';
                break;
            case 'transferencia':
                tipoClass = 'movement-transfer';
                tipoText = 'Transferencia';
                break;
            default:
                tipoClass = 'movement-other';
                tipoText = movimiento.tipo || 'Otro';
        }
        
        // Formatear cantidad
        let cantidadFormateada = '';
        if (movimiento.cantidadAnterior !== undefined && movimiento.cantidadNueva !== undefined) {
            const diferencia = movimiento.cantidadNueva - movimiento.cantidadAnterior;
            if (diferencia > 0) {
                cantidadFormateada = `+${diferencia}`;
            } else {
                cantidadFormateada = `${diferencia}`;
            }
        } else {
            cantidadFormateada = '-';
        }
        
        row.innerHTML = `
            <td>${fechaFormateada}</td>
            <td>
                <div class="movement-type ${tipoClass}">
                    ${tipoText}
                </div>
            </td>
            <td>${movimiento.insumo?.nombre || 'No especificado'}</td>
            <td class="quantity-cell">
                <span class="quantity ${diferencia > 0 ? 'positive' : diferencia < 0 ? 'negative' : ''}">
                    ${cantidadFormateada}
                </span>
                <span class="unit">${movimiento.insumo?.unidad || 'u'}</span>
            </td>
            <td>${movimiento.cantidadAnterior || 0} → ${movimiento.cantidadNueva || 0}</td>
            <td>${movimiento.usuario || 'Sistema'}</td>
            <td class="actions-cell">
                <button class="action-btn view-btn" onclick="viewMovimiento('${movimiento.id}')" title="Ver detalles">
                    <i class="mdi mdi-eye-outline"></i>
                </button>
            </td>
        `;
        movimientosList.appendChild(row);
    });
    
    // Actualizar contador
    const countElement = document.getElementById('movimientos-count');
    if (countElement) {
        countElement.textContent = filteredMovimientos.length;
    }
}

// Inicializar eventos
function initEvents() {
    // Botón para registrar movimiento
    const addBtn = document.getElementById('add-movimiento-btn');
    if (addBtn) {
        addBtn.addEventListener('click', () => showMovimientoForm());
    }
    
    // Búsqueda
    const searchInput = document.getElementById('search-movimientos');
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            currentFilters.search = searchInput.value;
            filterAndDisplayMovimientos();
        });
    }
    
    // Filtro de tipo
    const tipoFilter = document.getElementById('filter-tipo');
    if (tipoFilter) {
        tipoFilter.addEventListener('change', () => {
            currentFilters.tipo = tipoFilter.value;
            filterAndDisplayMovimientos();
        });
    }
    
    // Filtro de fecha
    const fechaFilter = document.getElementById('filter-fecha');
    if (fechaFilter) {
        fechaFilter.addEventListener('change', () => {
            currentFilters.fecha = fechaFilter.value;
            filterAndDisplayMovimientos();
        });
    }
    
    // Filtro de insumo
    const insumoFilter = document.getElementById('filter-insumo');
    if (insumoFilter) {
        insumoFilter.addEventListener('change', () => {
            currentFilters.insumo = insumoFilter.value;
            filterAndDisplayMovimientos();
        });
    }
    
    // Botón para limpiar filtros
    const clearFiltersBtn = document.getElementById('clear-filters');
    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', () => {
            currentFilters = {
                search: '',
                tipo: '',
                fecha: '',
                insumo: ''
            };
            
            if (searchInput) searchInput.value = '';
            if (tipoFilter) tipoFilter.value = '';
            if (fechaFilter) fechaFilter.value = '';
            if (insumoFilter) insumoFilter.value = '';
            
            filterAndDisplayMovimientos();
        });
    }
}

// Mostrar formulario de movimiento
function showMovimientoForm() {
    // Crear modal
    const modalHTML = `
        <div class="modal-overlay" id="movimiento-modal">
            <div class="modal-container">
                <div class="modal-header">
                    <h3>Registrar Movimiento</h3>
                    <button class="modal-close-btn" id="close-modal">
                        <i class="mdi mdi-close"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <form id="movimiento-form">
                        <div class="form-row">
                            <div class="form-group">
                                <label for="movimiento-tipo">Tipo de Movimiento *</label>
                                <select id="movimiento-tipo" required>
                                    <option value="">Seleccione un tipo</option>
                                    <option value="entrada">Entrada</option>
                                    <option value="salida">Salida</option>
                                    <option value="ajuste">Ajuste de Inventario</option>
                                    <option value="transferencia">Transferencia</option>
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label for="movimiento-insumo">Insumo *</label>
                                <select id="movimiento-insumo" required>
                                    <option value="">Seleccione un insumo</option>
                                    ${insumosData.map(insumo => `<option value="${insumo.id}">${insumo.nombre}</option>`).join('')}
                                </select>
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="movimiento-cantidad">Cantidad *</label>
                                <div class="input-group">
                                    <input type="number" id="movimiento-cantidad" step="0.01" required>
                                    <span class="input-group-text" id="unidad-display">u</span>
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label for="movimiento-fecha">Fecha *</label>
                                <input type="datetime-local" id="movimiento-fecha" required>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label for="movimiento-observaciones">Observaciones</label>
                            <textarea id="movimiento-observaciones" rows="3" placeholder="Detalles adicionales del movimiento"></textarea>
                        </div>
                        
                        <div class="form-actions">
                            <button type="button" class="btn-secondary" id="cancel-form">Cancelar</button>
                            <button type="submit" class="btn-primary">Registrar</button>
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
    document.getElementById('movimiento-form').addEventListener('submit', saveMovimiento);
    
    // Establecer fecha actual por defecto
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    
    document.getElementById('movimiento-fecha').value = `${year}-${month}-${day}T${hours}:${minutes}`;
    
    // Actualizar unidad al cambiar el insumo
    const insumoSelect = document.getElementById('movimiento-insumo');
    insumoSelect.addEventListener('change', () => {
        const insumoId = insumoSelect.value;
        const insumo = insumosData.find(i => i.id === insumoId);
        
        if (insumo) {
            document.getElementById('unidad-display').textContent = insumo.unidad || 'u';
        } else {
            document.getElementById('unidad-display').textContent = 'u';
        }
    });
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

// Guardar movimiento
function saveMovimiento(e) {
    e.preventDefault();
    
    const tipo = document.getElementById('movimiento-tipo').value;
    const insumoId = document.getElementById('movimiento-insumo').value;
    const cantidad = parseFloat(document.getElementById('movimiento-cantidad').value);
    const fechaStr = document.getElementById('movimiento-fecha').value;
    const observaciones = document.getElementById('movimiento-observaciones').value;
    
    // Validar que la cantidad no sea cero
    if (cantidad === 0) {
        alert('La cantidad no puede ser cero');
        return;
    }
    
    // Convertir fecha a timestamp
    const fecha = new Date(fechaStr);
    
    // Obtener el insumo seleccionado
    db.collection('insumos').doc(insumoId).get()
        .then(doc => {
            if (!doc.exists) {
                throw new Error('El insumo seleccionado no existe');
            }
            
            const insumo = doc.data();
            let cantidadAnterior = insumo.cantidad || 0;
            let cantidadNueva = cantidadAnterior;
            
            // Calcular nueva cantidad según tipo de movimiento
            switch (tipo) {
                case 'entrada':
                    cantidadNueva = cantidadAnterior + cantidad;
                    break;
                case 'salida':
                    cantidadNueva = cantidadAnterior - cantidad;
                    if (cantidadNueva < 0) {
                        throw new Error('No hay suficiente stock para realizar esta salida');
                    }
                    break;
                case 'ajuste':
                    cantidadNueva = cantidad;
                    break;
                case 'transferencia':
                    // Para transferencias, la cantidad representa lo que sale
                    cantidadNueva = cantidadAnterior - cantidad;
                    if (cantidadNueva < 0) {
                        throw new Error('No hay suficiente stock para realizar esta transferencia');
                    }
                    break;
            }
            
            // Crear batch para operaciones atómicas
            const batch = db.batch();
            
            // Actualizar cantidad en insumo
            batch.update(doc.ref, { 
                cantidad: cantidadNueva,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            // Crear nuevo movimiento
            const movimientoRef = db.collection('movimientos').doc();
            batch.set(movimientoRef, {
                tipo: tipo,
                insumoId: insumoId,
                cantidadAnterior: cantidadAnterior,
                cantidadNueva: cantidadNueva,
                fecha: firebase.firestore.Timestamp.fromDate(fecha),
                observaciones: observaciones,
                usuario: auth.currentUser.email,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            // Ejecutar batch
            return batch.commit();
        })
        .then(() => {
            closeModal();
            loadMovimientos();
            showNotification(
                'Movimiento registrado',
                `Se ha registrado el movimiento correctamente.`,
                'success'
            );
        })
        .catch(error => {
            console.error("Error al registrar movimiento:", error);
            alert(`Error: ${error.message}`);
        });
}

// Ver detalles de movimiento
function viewMovimiento(movimientoId) {
    const movimiento = movimientosData.find(m => m.id === movimientoId);
    
    if (!movimiento) {
        showNotification('Error', 'Movimiento no encontrado', 'error');
        return;
    }
    
    // Formatear fecha
    let fechaFormateada = 'No disponible';
    if (movimiento.fecha) {
        const fecha = movimiento.fecha.toDate();
        fechaFormateada = fecha.toLocaleDateString('es-ES') + ' ' + fecha.toLocaleTimeString('es-ES', {hour: '2-digit', minute: '2-digit'});
    }
    
    // Determinar tipo de movimiento
    let tipoClass = '';
    let tipoText = '';
    
    switch(movimiento.tipo) {
        case 'entrada':
            tipoClass = 'movement-in';
            tipoText = 'Entrada';
            break;
        case 'salida':
            tipoClass = 'movement-out';
            tipoText = 'Salida';
            break;
        case 'ajuste':
            tipoClass = 'movement-adjust';
            tipoText = 'Ajuste';
            break;
        case 'transferencia':
            tipoClass = 'movement-transfer';
            tipoText = 'Transferencia';
            break;
        default:
            tipoClass = 'movement-other';
            tipoText = movimiento.tipo || 'Otro';
    }
    
    // Formatear cantidad
    let cantidadFormateada = '';
    let diferencia = 0;
    if (movimiento.cantidadAnterior !== undefined && movimiento.cantidadNueva !== undefined) {
        diferencia = movimiento.cantidadNueva - movimiento.cantidadAnterior;
        if (diferencia > 0) {
            cantidadFormateada = `+${diferencia}`;
        } else {
            cantidadFormateada = `${diferencia}`;
        }
    } else {
        cantidadFormateada = '-';
    }
    
    // Crear modal
    const modalHTML = `
        <div class="modal-overlay" id="movimiento-details-modal">
            <div class="modal-container">
                <div class="modal-header">
                    <h3>Detalles del Movimiento</h3>
                    <button class="modal-close-btn" id="close-modal">
                        <i class="mdi mdi-close"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="movimiento-details">
                        <div class="movimiento-details-header">
                            <div class="movement-type-large ${tipoClass}">
                                <i class="mdi ${movimiento.tipo === 'entrada' ? 'mdi-arrow-down-bold' : movimiento.tipo === 'salida' ? 'mdi-arrow-up-bold' : 'mdi-swap-horizontal-bold'}"></i>
                                <span>${tipoText}</span>
                            </div>
                            <div class="movimiento-meta">
                                <div class="movimiento-date">
                                    <i class="mdi mdi-calendar"></i>
                                    <span>${fechaFormateada}</span>
                                </div>
                                <div class="movimiento-user">
                                    <i class="mdi mdi-account"></i>
                                    <span>${movimiento.usuario || 'Sistema'}</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="details-section">
                            <h4>Información del Insumo</h4>
                            <div class="details-grid">
                                <div class="details-item">
                                    <div class="details-label">Insumo</div>
                                    <div class="details-value">${movimiento.insumo?.nombre || 'No especificado'}</div>
                                </div>
                                <div class="details-item">
                                    <div class="details-label">Categoría</div>
                                    <div class="details-value">${movimiento.insumo?.categoria || 'No especificada'}</div>
                                </div>
                                <div class="details-item">
                                    <div class="details-label">Ubicación</div>
                                    <div class="details-value">${movimiento.insumo?.ubicacion || 'No especificada'}</div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="details-section">
                            <h4>Cambio en Inventario</h4>
                            <div class="inventory-change">
                                <div class="inventory-before">
                                    <div class="inventory-value">${movimiento.cantidadAnterior || 0}</div>
                                    <div class="inventory-label">Anterior</div>
                                </div>
                                <div class="inventory-arrow">
                                    <i class="mdi mdi-arrow-right"></i>
                                    <div class="inventory-difference ${diferencia > 0 ? 'positive' : diferencia < 0 ? 'negative' : ''}">
                                        ${cantidadFormateada} ${movimiento.insumo?.unidad || 'u'}
                                    </div>
                                </div>
                                <div class="inventory-after">
                                    <div class="inventory-value">${movimiento.cantidadNueva || 0}</div>
                                    <div class="inventory-label">Actual</div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="details-section">
                            <h4>Observaciones</h4>
                            <p>${movimiento.observaciones || 'No hay observaciones registradas.'}</p>
                        </div>
                    </div>
                    
                    <div class="modal-actions">
                        <button class="btn-secondary" id="close-details">Cerrar</button>
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