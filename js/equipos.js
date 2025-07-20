// Variables globales
let equiposData = [];
let currentFilters = {
    search: '',
    estado: '',
    tipo: ''
};

// Inicialización cuando se carga la página
document.addEventListener('DOMContentLoaded', () => {
    // Cargar equipos
    loadEquipos();
    
    // Inicializar eventos
    initEvents();
});

// Cargar equipos desde Firestore
function loadEquipos() {
    const equiposGrid = document.getElementById('equipos-grid');
    if (!equiposGrid) return;
    
    equiposGrid.innerHTML = '<div class="loading">Cargando equipos...</div>';
    
    db.collection('equipos')
        .orderBy('nombre')
        .get()
        .then(snapshot => {
            equiposData = [];
            
            if (snapshot.empty) {
                equiposGrid.innerHTML = '<div class="empty-message">No hay equipos registrados</div>';
                return;
            }
            
            snapshot.forEach(doc => {
                const equipo = doc.data();
                equipo.id = doc.id;
                equiposData.push(equipo);
            });
            
            // Aplicar filtros iniciales y mostrar
            filterAndDisplayEquipos();
        })
        .catch(error => {
            console.error("Error al cargar equipos:", error);
            equiposGrid.innerHTML = `<div class="error-message">Error al cargar equipos: ${error.message}</div>`;
            showNotification('Error', 'No se pudieron cargar los equipos', 'error');
        });
}

// Filtrar y mostrar equipos
function filterAndDisplayEquipos() {
    const equiposGrid = document.getElementById('equipos-grid');
    if (!equiposGrid) return;
    
    // Aplicar filtros
    let filteredEquipos = equiposData;
    
    if (currentFilters.search) {
        const searchTerm = currentFilters.search.toLowerCase();
        filteredEquipos = filteredEquipos.filter(equipo => 
            equipo.nombre.toLowerCase().includes(searchTerm) ||
            equipo.serial?.toLowerCase().includes(searchTerm) ||
            equipo.marca?.toLowerCase().includes(searchTerm) ||
            equipo.modelo?.toLowerCase().includes(searchTerm)
        );
    }
    
    if (currentFilters.estado) {
        filteredEquipos = filteredEquipos.filter(equipo => 
            equipo.estado === currentFilters.estado
        );
    }
    
    if (currentFilters.tipo) {
        filteredEquipos = filteredEquipos.filter(equipo => 
            equipo.tipo === currentFilters.tipo
        );
    }
    
    // Mostrar resultados
    if (filteredEquipos.length === 0) {
        equiposGrid.innerHTML = '<div class="empty-message">No se encontraron equipos con los filtros aplicados</div>';
        return;
    }
    
    equiposGrid.innerHTML = '';
    filteredEquipos.forEach(equipo => {
        const card = createEquipoCard(equipo);
        equiposGrid.appendChild(card);
    });
    
    // Actualizar contador
    const countElement = document.getElementById('equipos-count');
    if (countElement) {
        countElement.textContent = filteredEquipos.length;
    }
}

// Crear tarjeta de equipo
function createEquipoCard(equipo) {
    const card = document.createElement('div');
    card.className = `equipo-card ${equipo.estado}`;
    card.dataset.id = equipo.id;
    
    // Determinar icono según tipo de equipo
    let equipoIcon = 'mdi-microscope';
    switch(equipo.tipo) {
        case 'analizador':
            equipoIcon = 'mdi-chart-line';
            break;
        case 'centrifuga':
            equipoIcon = 'mdi-rotate-3d';
            break;
        case 'refrigerador':
            equipoIcon = 'mdi-fridge';
            break;
        case 'incubadora':
            equipoIcon = 'mdi-thermometer';
            break;
        case 'balanza':
            equipoIcon = 'mdi-scale-balance';
            break;
        case 'espectrofotometro':
            equipoIcon = 'mdi-eyedropper';
            break;
        case 'autoclave':
            equipoIcon = 'mdi-water-boiler';
            break;
        case 'medidor':
            equipoIcon = 'mdi-gauge';
            break;
        default:
            equipoIcon = 'mdi-microscope';
    }
    
    // Determinar clase de estado
    let estadoClass = 'status-operativo';
    let estadoText = 'Operativo';
    
    switch(equipo.estado) {
        case 'mantenimiento':
            estadoClass = 'status-mantenimiento';
            estadoText = 'En mantenimiento';
            break;
        case 'reparacion':
            estadoClass = 'status-reparacion';
            estadoText = 'En reparación';
            break;
        case 'baja':
            estadoClass = 'status-baja';
            estadoText = 'Fuera de servicio';
            break;
        case 'calibracion':
            estadoClass = 'status-calibracion';
            estadoText = 'En calibración';
            break;
    }
    
    card.innerHTML = `
        <div class="equipo-icon">
            <i class="mdi ${equipoIcon}"></i>
        </div>
        <div class="equipo-info">
            <h3>${equipo.nombre}</h3>
            <p class="equipo-modelo">${equipo.marca || ''} ${equipo.modelo || ''}</p>
            <p class="equipo-serial">S/N: ${equipo.serial || 'No disponible'}</p>
            <div class="equipo-status ${estadoClass}">
                <span>${estadoText}</span>
            </div>
        </div>
        <div class="equipo-actions">
            <button class="action-btn view-btn" onclick="viewEquipo('${equipo.id}')" title="Ver detalles">
                <i class="mdi mdi-eye-outline"></i>
            </button>
            <button class="action-btn maintenance-btn" onclick="showMaintenanceForm('${equipo.id}')" title="Programar mantenimiento">
                <i class="mdi mdi-tools"></i>
            </button>
            <button class="action-btn edit-btn" onclick="editEquipo('${equipo.id}')" title="Editar">
                <i class="mdi mdi-pencil-outline"></i>
            </button>
        </div>
    `;
    
    return card;
}

// Inicializar eventos
function initEvents() {
    // Botón para agregar equipo
    const addBtn = document.getElementById('add-equipo-btn');
    if (addBtn) {
        addBtn.addEventListener('click', () => showEquipoForm());
    }
    
    // Búsqueda
    const searchInput = document.getElementById('search-equipos');
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            currentFilters.search = searchInput.value;
            filterAndDisplayEquipos();
        });
    }
    
    const searchBtn = document.getElementById('search-btn');
    if (searchBtn) {
        searchBtn.addEventListener('click', () => {
            if (searchInput) {
                currentFilters.search = searchInput.value;
                filterAndDisplayEquipos();
            }
        });
    }
    
    // Filtro de estado
    const estadoFilter = document.getElementById('filter-estado');
    if (estadoFilter) {
        estadoFilter.addEventListener('change', () => {
            currentFilters.estado = estadoFilter.value;
            filterAndDisplayEquipos();
        });
    }
    
    // Filtro de tipo
    const tipoFilter = document.getElementById('filter-tipo');
    if (tipoFilter) {
        tipoFilter.addEventListener('change', () => {
            currentFilters.tipo = tipoFilter.value;
            filterAndDisplayEquipos();
        });
    }
    
    // Botón para limpiar filtros
    const clearFiltersBtn = document.getElementById('clear-filters');
    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', () => {
            currentFilters = {
                search: '',
                estado: '',
                tipo: ''
            };
            
            if (searchInput) searchInput.value = '';
            if (estadoFilter) estadoFilter.value = '';
            if (tipoFilter) tipoFilter.value = '';
            
            filterAndDisplayEquipos();
        });
    }
}

// Mostrar formulario de equipo (para agregar o editar)
function showEquipoForm(equipoId = null) {
    // Título del modal
    const modalTitle = equipoId ? 'Editar Equipo' : 'Agregar Nuevo Equipo';
    
    // Crear modal
    const modalHTML = `
        <div class="modal-overlay" id="equipo-modal">
            <div class="modal-container">
                <div class="modal-header">
                    <h3>${modalTitle}</h3>
                    <button class="modal-close-btn" id="close-modal">
                        <i class="mdi mdi-close"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <form id="equipo-form">
                        <input type="hidden" id="equipo-id" value="${equipoId || ''}">
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="equipo-nombre">Nombre *</label>
                                <input type="text" id="equipo-nombre" required placeholder="Nombre del equipo">
                            </div>
                            
                            <div class="form-group">
                                <label for="equipo-tipo">Tipo *</label>
                                <select id="equipo-tipo" required>
                                    <option value="">Seleccione un tipo</option>
                                    <option value="analizador">Analizador</option>
                                    <option value="centrifuga">Centrífuga</option>
                                    <option value="refrigerador">Refrigerador</option>
                                    <option value="incubadora">Incubadora</option>
                                    <option value="balanza">Balanza</option>
                                    <option value="espectrofotometro">Espectrofotómetro</option>
                                    <option value="autoclave">Autoclave</option>
                                    <option value="medidor">Medidor</option>
                                    <option value="otro">Otro</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="equipo-marca">Marca</label>
                                <input type="text" id="equipo-marca" placeholder="Marca del equipo">
                            </div>
                            
                            <div class="form-group">
                                <label for="equipo-modelo">Modelo</label>
                                <input type="text" id="equipo-modelo" placeholder="Modelo del equipo">
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="equipo-serial">Número de Serie</label>
                                <input type="text" id="equipo-serial" placeholder="Número de serie">
                            </div>
                            
                            <div class="form-group">
                                <label for="equipo-fecha-adquisicion">Fecha de Adquisición</label>
                                <input type="date" id="equipo-fecha-adquisicion">
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="equipo-estado">Estado *</label>
                                <select id="equipo-estado" required>
                                    <option value="operativo">Operativo</option>
                                    <option value="mantenimiento">En mantenimiento</option>
                                    <option value="reparacion">En reparación</option>
                                    <option value="calibracion">En calibración</option>
                                    <option value="baja">Fuera de servicio</option>
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label for="equipo-ubicacion">Ubicación</label>
                                <input type="text" id="equipo-ubicacion" placeholder="Ubicación del equipo">
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label for="equipo-descripcion">Descripción</label>
                            <textarea id="equipo-descripcion" rows="3" placeholder="Descripción detallada del equipo"></textarea>
                        </div>
                        
                        <div class="form-group">
                            <label for="equipo-notas">Notas de mantenimiento</label>
                            <textarea id="equipo-notas" rows="2" placeholder="Notas sobre mantenimiento o uso"></textarea>
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
    document.getElementById('equipo-form').addEventListener('submit', saveEquipo);
    
    // Si es edición, cargar datos del equipo
    if (equipoId) {
        const equipo = equiposData.find(e => e.id === equipoId);
        
        if (equipo) {
            document.getElementById('equipo-nombre').value = equipo.nombre || '';
            document.getElementById('equipo-tipo').value = equipo.tipo || '';
            document.getElementById('equipo-marca').value = equipo.marca || '';
            document.getElementById('equipo-modelo').value = equipo.modelo || '';
            document.getElementById('equipo-serial').value = equipo.serial || '';
            document.getElementById('equipo-fecha-adquisicion').value = equipo.fechaAdquisicion || '';
            document.getElementById('equipo-estado').value = equipo.estado || 'operativo';
            document.getElementById('equipo-ubicacion').value = equipo.ubicacion || '';
            document.getElementById('equipo-descripcion').value = equipo.descripcion || '';
            document.getElementById('equipo-notas').value = equipo.notas || '';
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

// Guardar equipo
function saveEquipo(e) {
    e.preventDefault();
    
    const equipoId = document.getElementById('equipo-id').value;
    const equipoData = {
        nombre: document.getElementById('equipo-nombre').value,
        tipo: document.getElementById('equipo-tipo').value,
        marca: document.getElementById('equipo-marca').value,
        modelo: document.getElementById('equipo-modelo').value,
        serial: document.getElementById('equipo-serial').value,
        fechaAdquisicion: document.getElementById('equipo-fecha-adquisicion').value,
        estado: document.getElementById('equipo-estado').value,
        ubicacion: document.getElementById('equipo-ubicacion').value,
        descripcion: document.getElementById('equipo-descripcion').value,
        notas: document.getElementById('equipo-notas').value,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    // Guardar en Firestore
    let savePromise;
    
    if (equipoId) {
        // Actualizar equipo existente
        savePromise = db.collection('equipos').doc(equipoId).update(equipoData);
    } else {
        // Crear nuevo equipo
        equipoData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
        equipoData.createdBy = auth.currentUser.uid;
        savePromise = db.collection('equipos').add(equipoData);
    }
    
    savePromise
        .then(() => {
            closeModal();
            loadEquipos();
            showNotification(
                equipoId ? 'Equipo actualizado' : 'Equipo agregado',
                `El equipo "${equipoData.nombre}" ha sido ${equipoId ? 'actualizado' : 'agregado'} correctamente.`,
                'success'
            );
            
            // Si cambió el estado, registrar en historial
            if (equipoId) {
                const originalEquipo = equiposData.find(e => e.id === equipoId);
                if (originalEquipo && originalEquipo.estado !== equipoData.estado) {
                    registerEstadoChange(equipoId, originalEquipo.estado, equipoData.estado);
                }
            }
        })
        .catch(error => {
            console.error("Error al guardar equipo:", error);
            showNotification('Error', `No se pudo ${equipoId ? 'actualizar' : 'agregar'} el equipo: ${error.message}`, 'error');
        });
}

// Registrar cambio de estado en historial
function registerEstadoChange(equipoId, estadoAnterior, estadoNuevo) {
    db.collection('historial-equipos').add({
        equipoId: equipoId,
        estadoAnterior: estadoAnterior,
        estadoNuevo: estadoNuevo,
        fecha: firebase.firestore.FieldValue.serverTimestamp(),
        usuario: auth.currentUser.uid,
        tipo: 'cambio-estado'
    }).catch(error => {
        console.error("Error al registrar cambio de estado:", error);
    });
}

// Ver detalles de equipo
function viewEquipo(equipoId) {
    const equipo = equiposData.find(e => e.id === equipoId);
    
    if (!equipo) {
        showNotification('Error', 'Equipo no encontrado', 'error');
        return;
    }
    
    // Determinar icono según tipo de equipo
    let equipoIcon = 'mdi-microscope';
    switch(equipo.tipo) {
        case 'analizador': equipoIcon = 'mdi-chart-line'; break;
        case 'centrifuga': equipoIcon = 'mdi-rotate-3d'; break;
        case 'refrigerador': equipoIcon = 'mdi-fridge'; break;
        case 'incubadora': equipoIcon = 'mdi-thermometer'; break;
        case 'balanza': equipoIcon = 'mdi-scale-balance'; break;
        case 'espectrofotometro': equipoIcon = 'mdi-eyedropper'; break;
        case 'autoclave': equipoIcon = 'mdi-water-boiler'; break;
        case 'medidor': equipoIcon = 'mdi-gauge'; break;
    }
    
    // Determinar clase de estado
    let estadoClass = 'status-operativo';
    let estadoText = 'Operativo';
    
    switch(equipo.estado) {
        case 'mantenimiento':
            estadoClass = 'status-mantenimiento';
            estadoText = 'En mantenimiento';
            break;
        case 'reparacion':
            estadoClass = 'status-reparacion';
            estadoText = 'En reparación';
            break;
        case 'baja':
            estadoClass = 'status-baja';
            estadoText = 'Fuera de servicio';
            break;
        case 'calibracion':
            estadoClass = 'status-calibracion';
            estadoText = 'En calibración';
            break;
    }
    
    // Formatear fecha de adquisición
    let fechaAdquisicion = 'No registrada';
    if (equipo.fechaAdquisicion) {
        const fecha = new Date(equipo.fechaAdquisicion);
        fechaAdquisicion = fecha.toLocaleDateString('es-ES');
    }
    
    // Crear modal de detalles
    const modalHTML = `
        <div class="modal-overlay" id="equipo-details-modal">
            <div class="modal-container">
                <div class="modal-header">
                    <h3>Detalles del Equipo</h3>
                    <button class="modal-close-btn" id="close-modal">
                        <i class="mdi mdi-close"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="equipo-details">
                        <div class="equipo-details-header">
                            <div class="equipo-details-icon">
                                <i class="mdi ${equipoIcon}"></i>
                            </div>
                            <div class="equipo-details-title">
                                <h2>${equipo.nombre}</h2>
                                <div class="equipo-status ${estadoClass}">
                                    <span>${estadoText}</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="details-section">
                            <h4>Información General</h4>
                            <div class="details-grid">
                                <div class="details-item">
                                    <div class="details-label">Marca</div>
                                    <div class="details-value">${equipo.marca || 'No especificada'}</div>
                                </div>
                                <div class="details-item">
                                    <div class="details-label">Modelo</div>
                                    <div class="details-value">${equipo.modelo || 'No especificado'}</div>
                                </div>
                                <div class="details-item">
                                    <div class="details-label">Número de Serie</div>
                                    <div class="details-value">${equipo.serial || 'No especificado'}</div>
                                </div>
                                <div class="details-item">
                                    <div class="details-label">Tipo</div>
                                    <div class="details-value">${equipo.tipo ? equipo.tipo.charAt(0).toUpperCase() + equipo.tipo.slice(1) : 'No especificado'}</div>
                                </div>
                                <div class="details-item">
                                    <div class="details-label">Ubicación</div>
                                    <div class="details-value">${equipo.ubicacion || 'No especificada'}</div>
                                </div>
                                <div class="details-item">
                                    <div class="details-label">Fecha de Adquisición</div>
                                    <div class="details-value">${fechaAdquisicion}</div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="details-section">
                            <h4>Descripción</h4>
                            <p>${equipo.descripcion || 'No hay descripción disponible.'}</p>
                        </div>
                        
                        <div class="details-section">
                            <h4>Notas de Mantenimiento</h4>
                            <p>${equipo.notas || 'No hay notas de mantenimiento.'}</p>
                        </div>
                        
                        <div class="details-section">
                            <h4>Próximos Mantenimientos</h4>
                            <div id="mantenimientos-list" class="loading-container">
                                <div class="loading">Cargando mantenimientos...</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="modal-actions">
                        <button class="btn-secondary" id="close-details">Cerrar</button>
                        <button class="btn-primary" onclick="editEquipo('${equipo.id}')">Editar</button>
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
    
    // Cargar mantenimientos programados
    loadMaintenance(equipoId);
}

// Cargar mantenimientos programados
function loadMaintenance(equipoId) {
    const mantenimientosList = document.getElementById('mantenimientos-list');
    
    db.collection('mantenimientos')
        .where('equipoId', '==', equipoId)
        .where('estado', '==', 'programado')
        .orderBy('fecha')
        .limit(5)
        .get()
        .then(snapshot => {
            if (snapshot.empty) {
                mantenimientosList.innerHTML = '<p class="empty-message">No hay mantenimientos programados.</p>';
                return;
            }
            
            let html = '<div class="maintenance-list">';
            
            snapshot.forEach(doc => {
                const mantenimiento = doc.data();
                const fecha = mantenimiento.fecha.toDate();
                
                html += `
                    <div class="maintenance-item">
                        <div class="maintenance-date">
                            <div class="date-day">${fecha.getDate()}</div>
                            <div class="date-month">${fecha.toLocaleDateString('es-ES', { month: 'short' })}</div>
                        </div>
                        <div class="maintenance-info">
                            <div class="maintenance-type">${mantenimiento.tipo.charAt(0).toUpperCase() + mantenimiento.tipo.slice(1)}</div>
                            <div class="maintenance-description">${mantenimiento.descripcion}</div>
                            <div class="maintenance-responsible">Responsable: ${mantenimiento.responsable}</div>
                        </div>
                    </div>
                `;
            });
            
            html += '</div>';
            mantenimientosList.innerHTML = html;
        })
        .catch(error => {
            console.error("Error al cargar mantenimientos:", error);
            mantenimientosList.innerHTML = `<div class="error-message">Error al cargar mantenimientos: ${error.message}</div>`;
        });
}

// Mostrar formulario de mantenimiento
function showMaintenanceForm(equipoId) {
    const equipo = equiposData.find(e => e.id === equipoId);
    
    if (!equipo) {
        showNotification('Error', 'Equipo no encontrado', 'error');
        return;
    }
    
    // Crear modal
    const modalHTML = `
        <div class="modal-overlay" id="maintenance-modal">
            <div class="modal-container">
                <div class="modal-header">
                    <h3>Programar Mantenimiento</h3>
                    <button class="modal-close-btn" id="close-modal">
                        <i class="mdi mdi-close"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="maintenance-equipo-info">
                        <div class="maintenance-equipo-name">${equipo.nombre}</div>
                        <div class="maintenance-equipo-details">${equipo.marca || ''} ${equipo.modelo || ''}</div>
                    </div>
                    
                    <form id="maintenance-form">
                        <input type="hidden" id="equipo-id" value="${equipoId}">
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="maintenance-date">Fecha de Mantenimiento *</label>
                                <input type="date" id="maintenance-date" required>
                            </div>
                            
                            <div class="form-group">
                                <label for="maintenance-type">Tipo de Mantenimiento *</label>
                                <select id="maintenance-type" required>
                                    <option value="">Seleccione un tipo</option>
                                    <option value="preventivo">Preventivo</option>
                                    <option value="correctivo">Correctivo</option>
                                    <option value="calibracion">Calibración</option>
                                    <option value="verificacion">Verificación</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label for="maintenance-description">Descripción *</label>
                            <textarea id="maintenance-description" rows="3" required placeholder="Describa el mantenimiento a realizar"></textarea>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="maintenance-responsible">Responsable *</label>
                                <input type="text" id="maintenance-responsible" required placeholder="Persona o empresa responsable">
                            </div>
                            
                            <div class="form-group">
                                <label for="maintenance-duration">Duración estimada (horas)</label>
                                <input type="number" id="maintenance-duration" min="0.5" step="0.5" placeholder="Duración en horas">
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label for="maintenance-notes">Notas adicionales</label>
                            <textarea id="maintenance-notes" rows="2" placeholder="Notas o instrucciones adicionales"></textarea>
                        </div>
                        
                        <div class="form-actions">
                            <button type="button" class="btn-secondary" id="cancel-form">Cancelar</button>
                            <button type="submit" class="btn-primary">Programar</button>
                        </div