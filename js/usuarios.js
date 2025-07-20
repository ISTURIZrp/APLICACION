// Variables globales
let usuariosData = [];
let currentFilters = {
    search: '',
    role: '',
    status: ''
};

// Inicialización cuando se carga la página
document.addEventListener('DOMContentLoaded', () => {
    // Cargar usuarios
    loadUsuarios();
    
    // Inicializar eventos
    initEvents();
});

// Cargar usuarios desde Firestore
function loadUsuarios() {
    const usuariosList = document.getElementById('usuarios-list');
    if (!usuariosList) return;
    
    usuariosList.innerHTML = '<tr><td colspan="6" class="loading-cell">Cargando usuarios...</td></tr>';
    
    db.collection('usuarios')
        .orderBy('nombre')
        .get()
        .then(snapshot => {
            usuariosData = [];
            
            if (snapshot.empty) {
                usuariosList.innerHTML = '<tr><td colspan="6" class="empty-message">No hay usuarios registrados</td></tr>';
                return;
            }
            
            snapshot.forEach(doc => {
                const usuario = doc.data();
                usuario.id = doc.id;
                usuariosData.push(usuario);
            });
            
            // Aplicar filtros iniciales y mostrar
            filterAndDisplayUsuarios();
        })
        .catch(error => {
            console.error("Error al cargar usuarios:", error);
            usuariosList.innerHTML = `<tr><td colspan="6" class="error-message">Error al cargar usuarios: ${error.message}</td></tr>`;
            showNotification('Error', 'No se pudieron cargar los usuarios', 'error');
        });
}

// Filtrar y mostrar usuarios
function filterAndDisplayUsuarios() {
    const usuariosList = document.getElementById('usuarios-list');
    if (!usuariosList) return;
    
    // Aplicar filtros
    let filteredUsuarios = usuariosData;
    
    if (currentFilters.search) {
        const searchTerm = currentFilters.search.toLowerCase();
        filteredUsuarios = filteredUsuarios.filter(usuario => 
            usuario.nombre?.toLowerCase().includes(searchTerm) ||
            usuario.email?.toLowerCase().includes(searchTerm) ||
            usuario.departamento?.toLowerCase().includes(searchTerm)
        );
    }
    
    if (currentFilters.role) {
        filteredUsuarios = filteredUsuarios.filter(usuario => 
            usuario.role === currentFilters.role
        );
    }
    
    if (currentFilters.status) {
        filteredUsuarios = filteredUsuarios.filter(usuario => 
            usuario.status === currentFilters.status
        );
    }
    
    // Mostrar resultados
    if (filteredUsuarios.length === 0) {
        usuariosList.innerHTML = '<tr><td colspan="6" class="empty-message">No se encontraron usuarios con los filtros aplicados</td></tr>';
        return;
    }
    
    usuariosList.innerHTML = '';
    filteredUsuarios.forEach(usuario => {
        const row = document.createElement('tr');
        
        // Determinar rol
        let roleName = 'Usuario';
        switch(usuario.role) {
            case 'admin': roleName = 'Administrador'; break;
            case 'supervisor': roleName = 'Supervisor'; break;
            case 'tecnico': roleName = 'Técnico'; break;
            case 'viewer': roleName = 'Visualizador'; break;
        }
        
        // Determinar estado
        let statusClass = usuario.status === 'active' ? 'status-active' : 'status-inactive';
        let statusLabel = usuario.status === 'active' ? 'Activo' : 'Inactivo';
        
        // Formatear fecha del último acceso
        let lastLoginText = 'Nunca';
        if (usuario.lastLogin) {
            const lastLogin = usuario.lastLogin.toDate();
            lastLoginText = lastLogin.toLocaleDateString('es-ES') + ' ' + lastLogin.toLocaleTimeString('es-ES', {hour: '2-digit', minute: '2-digit'});
        }
        
        row.innerHTML = `
            <td>
                <div class="user-info-cell">
                    <div class="user-avatar small">
                        <span>${getInitials(usuario.nombre || 'Usuario')}</span>
                    </div>
                    <div class="user-info">
                        <p class="user-name">${usuario.nombre || 'Sin nombre'}</p>
                        <p class="user-email">${usuario.email || ''}</p>
                    </div>
                </div>
            </td>
            <td>${usuario.departamento || '-'}</td>
            <td>
                <div class="role-badge ${usuario.role || 'user'}">${roleName}</div>
            </td>
            <td>
                <div class="status-badge ${statusClass}">
                    ${statusLabel}
                </div>
            </td>
            <td>${lastLoginText}</td>
            <td class="actions-cell">
                <button class="action-btn view-btn" onclick="viewUsuario('${usuario.id}')" title="Ver detalles">
                    <i class="mdi mdi-eye-outline"></i>
                </button>
                <button class="action-btn edit-btn" onclick="editUsuario('${usuario.id}')" title="Editar">
                    <i class="mdi mdi-pencil-outline"></i>
                </button>
                <button class="action-btn ${usuario.status === 'active' ? 'disable-btn' : 'enable-btn'}" 
                    onclick="toggleUsuarioStatus('${usuario.id}')" 
                    title="${usuario.status === 'active' ? 'Desactivar' : 'Activar'}">
                    <i class="mdi ${usuario.status === 'active' ? 'mdi-account-off-outline' : 'mdi-account-check-outline'}"></i>
                </button>
            </td>
        `;
        usuariosList.appendChild(row);
    });
    
    // Actualizar contador
    const countElement = document.getElementById('usuarios-count');
    if (countElement) {
        countElement.textContent = filteredUsuarios.length;
    }
}

// Obtener iniciales del nombre
function getInitials(name) {
    return name
        .split(' ')
        .map(part => part.charAt(0))
        .join('')
        .toUpperCase()
        .substring(0, 2);
}

// Inicializar eventos
function initEvents() {
    // Botón para agregar usuario
    const addBtn = document.getElementById('add-usuario-btn');
    if (addBtn) {
        addBtn.addEventListener('click', () => showUsuarioForm());
    }
    
    // Búsqueda
    const searchInput = document.getElementById('search-usuarios');
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            currentFilters.search = searchInput.value;
            filterAndDisplayUsuarios();
        });
    }
    
    // Filtro de rol
    const roleFilter = document.getElementById('filter-role');
    if (roleFilter) {
        roleFilter.addEventListener('change', () => {
            currentFilters.role = roleFilter.value;
            filterAndDisplayUsuarios();
        });
    }
    
    // Filtro de estado
    const statusFilter = document.getElementById('filter-status');
    if (statusFilter) {
        statusFilter.addEventListener('change', () => {
            currentFilters.status = statusFilter.value;
            filterAndDisplayUsuarios();
        });
    }
    
    // Botón para limpiar filtros
    const clearFiltersBtn = document.getElementById('clear-filters');
    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', () => {
            currentFilters = {
                search: '',
                role: '',
                status: ''
            };
            
            if (searchInput) searchInput.value = '';
            if (roleFilter) roleFilter.value = '';
            if (statusFilter) statusFilter.value = '';
            
            filterAndDisplayUsuarios();
        });
    }
}

// Mostrar formulario de usuario (para agregar o editar)
function showUsuarioForm(usuarioId = null) {
    // Título del modal
    const modalTitle = usuarioId ? 'Editar Usuario' : 'Agregar Nuevo Usuario';
    const isNewUser = !usuarioId;
    
    // Crear modal
    const modalHTML = `
        <div class="modal-overlay" id="usuario-modal">
            <div class="modal-container">
                <div class="modal-header">
                    <h3>${modalTitle}</h3>
                    <button class="modal-close-btn" id="close-modal">
                        <i class="mdi mdi-close"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <form id="usuario-form">
                        <input type="hidden" id="usuario-id" value="${usuarioId || ''}">
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="usuario-nombre">Nombre completo *</label>
                                <input type="text" id="usuario-nombre" required placeholder="Nombre y apellidos">
                            </div>
                            
                            <div class="form-group">
                                <label for="usuario-email">Correo electrónico *</label>
                                <input type="email" id="usuario-email" required placeholder="correo@ejemplo.com" ${usuarioId ? 'readonly' : ''}>
                            </div>
                        </div>
                        
                        ${isNewUser ? `
                        <div class="form-row">
                            <div class="form-group">
                                <label for="usuario-password">Contraseña *</label>
                                <div class="input-container">
                                    <input type="password" id="usuario-password" required placeholder="Contraseña">
                                    <button type="button" class="toggle-password" tabindex="-1">
                                        <i class="mdi mdi-eye-outline"></i>
                                    </button>
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label for="usuario-password-confirm">Confirmar contraseña *</label>
                                <div class="input-container">
                                    <input type="password" id="usuario-password-confirm" required placeholder="Confirmar contraseña">
                                </div>
                            </div>
                        </div>
                        ` : ''}
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="usuario-role">Rol *</label>
                                <select id="usuario-role" required>
                                    <option value="">Seleccione un rol</option>
                                    <option value="admin">Administrador</option>
                                    <option value="supervisor">Supervisor</option>
                                    <option value="tecnico">Técnico</option>
                                    <option value="viewer">Visualizador</option>
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label for="usuario-departamento">Departamento</label>
                                <input type="text" id="usuario-departamento" placeholder="Departamento o área">
                            </div>
                        </div>
                        
                        <div class="form-row">
                            <div class="form-group">
                                <label for="usuario-telefono">Teléfono</label>
                                <input type="tel" id="usuario-telefono" placeholder="Número de teléfono">
                            </div>
                            
                            <div class="form-group">
                                <label for="usuario-status">Estado *</label>
                                <select id="usuario-status" required>
                                    <option value="active">Activo</option>
                                    <option value="inactive">Inactivo</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label for="usuario-notas">Notas</label>
                            <textarea id="usuario-notas" rows="2" placeholder="Notas adicionales"></textarea>
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
    document.getElementById('usuario-form').addEventListener('submit', saveUsuario);
    
    // Configurar toggle de contraseña si existe
    const togglePasswordBtn = document.querySelector('.toggle-password');
    if (togglePasswordBtn) {
        togglePasswordBtn.addEventListener('click', function() {
            const passwordInput = document.getElementById('usuario-password');
            const icon = this.querySelector('i');
            
            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                icon.classList.remove('mdi-eye-outline');
                icon.classList.add('mdi-eye-off-outline');
            } else {
                passwordInput.type = 'password';
                icon.classList.remove('mdi-eye-off-outline');
                icon.classList.add('mdi-eye-outline');
            }
        });
    }
    
    // Si es edición, cargar datos del usuario
    if (usuarioId) {
        const usuario = usuariosData.find(u => u.id === usuarioId);
        
        if (usuario) {
            document.getElementById('usuario-nombre').value = usuario.nombre || '';
            document.getElementById('usuario-email').value = usuario.email || '';
            document.getElementById('usuario-role').value = usuario.role || '';
            document.getElementById('usuario-departamento').value = usuario.departamento || '';
            document.getElementById('usuario-telefono').value = usuario.telefono || '';
            document.getElementById('usuario-status').value = usuario.status || 'active';
            document.getElementById('usuario-notas').value = usuario.notas || '';
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

// Guardar usuario
function saveUsuario(e) {
    e.preventDefault();
    
    const usuarioId = document.getElementById('usuario-id').value;
    const isNewUser = !usuarioId;
    
    // Datos comunes para nuevo usuario y actualización
    const usuarioData = {
        nombre: document.getElementById('usuario-nombre').value,
        email: document.getElementById('usuario-email').value,
        role: document.getElementById('usuario-role').value,
        departamento: document.getElementById('usuario-departamento').value,
        telefono: document.getElementById('usuario-telefono').value,
        status: document.getElementById('usuario-status').value,
        notas: document.getElementById('usuario-notas').value,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    // Si es un nuevo usuario, verificar contraseñas
    if (isNewUser) {
        const password = document.getElementById('usuario-password').value;
        const passwordConfirm = document.getElementById('usuario-password-confirm').value;
        
        if (password !== passwordConfirm) {
            alert('Las contraseñas no coinciden');
            return;
        }
        
        // Crear usuario en Authentication
        auth.createUserWithEmailAndPassword(usuarioData.email, password)
            .then((userCredential) => {
                // Añadir datos adicionales en Firestore
                usuarioData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
                usuarioData.createdBy = auth.currentUser.uid;
                
                return db.collection('usuarios').doc(userCredential.user.uid).set(usuarioData);
            })
            .then(() => {
                closeModal();
                loadUsuarios();
                showNotification(
                    'Usuario creado',
                    `El usuario "${usuarioData.nombre}" ha sido creado correctamente.`,
                    'success'
                );
            })
            .catch(error => {
                console.error("Error al crear usuario:", error);
                alert(`Error al crear usuario: ${error.message}`);
            });
    } else {
        // Actualizar usuario existente
        db.collection('usuarios').doc(usuarioId).update(usuarioData)
            .then(() => {
                closeModal();
                loadUsuarios();
                showNotification(
                    'Usuario actualizado',
                    `El usuario "${usuarioData.nombre}" ha sido actualizado correctamente.`,
                    'success'
                );
            })
            .catch(error => {
                console.error("Error al actualizar usuario:", error);
                alert(`Error al actualizar usuario: ${error.message}`);
            });
    }
}

// Ver detalles de usuario
function viewUsuario(usuarioId) {
    const usuario = usuariosData.find(u => u.id === usuarioId);
    
    if (!usuario) {
        showNotification('Error', 'Usuario no encontrado', 'error');
        return;
    }
    
    // Determinar rol
    let roleName = 'Usuario';
    switch(usuario.role) {
        case 'admin': roleName = 'Administrador'; break;
        case 'supervisor': roleName = 'Supervisor'; break;
        case 'tecnico': roleName = 'Técnico'; break;
        case 'viewer': roleName = 'Visualizador'; break;
    }
    
    // Determinar estado
    let statusClass = usuario.status === 'active' ? 'status-active' : 'status-inactive';
    let statusLabel = usuario.status === 'active' ? 'Activo' : 'Inactivo';
    
    // Formatear fechas
    let createdAtText = 'No disponible';
    if (usuario.createdAt) {
        const createdAt = usuario.createdAt.toDate();
        createdAtText = createdAt.toLocaleDateString('es-ES');
    }
    
    let lastLoginText = 'Nunca';
    if (usuario.lastLogin) {
        const lastLogin = usuario.lastLogin.toDate();
        lastLoginText = lastLogin.toLocaleDateString('es-ES') + ' ' + lastLogin.toLocaleTimeString('es-ES', {hour: '2-digit', minute: '2-digit'});
    }
    
    // Crear modal
    const modalHTML = `
        <div class="modal-overlay" id="usuario-details-modal">
            <div class="modal-container">
                <div class="modal-header">
                    <h3>Detalles del Usuario</h3>
                    <button class="modal-close-btn" id="close-modal">
                        <i class="mdi mdi-close"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="usuario-details">
                        <div class="usuario-details-header">
                            <div class="user-avatar large">
                                <span>${getInitials(usuario.nombre || 'Usuario')}</span>
                            </div>
                            <div class="usuario-details-title">
                                <h2>${usuario.nombre || 'Sin nombre'}</h2>
                                <div class="usuario-meta">
                                    <div class="role-badge ${usuario.role || 'user'}">${roleName}</div>
                                    <div class="status-badge ${statusClass}">
                                        ${statusLabel}
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="details-section">
                            <h4>Información de Contacto</h4>
                            <div class="details-grid">
                                <div class="details-item">
                                    <div class="details-label">Email</div>
                                    <div class="details-value">${usuario.email || 'No especificado'}</div>
                                </div>
                                <div class="details-item">
                                    <div class="details-label">Teléfono</div>
                                    <div class="details-value">${usuario.telefono || 'No especificado'}</div>
                                </div>
                                <div class="details-item">
                                    <div class="details-label">Departamento</div>
                                    <div class="details-value">${usuario.departamento || 'No especificado'}</div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="details-section">
                            <h4>Información de la Cuenta</h4>
                            <div class="details-grid">
                                <div class="details-item">
                                    <div class="details-label">Fecha de Creación</div>
                                    <div class="details-value">${createdAtText}</div>
                                </div>
                                <div class="details-item">
                                    <div class="details-label">Último Acceso</div>
                                    <div class="details-value">${lastLoginText}</div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="details-section">
                            <h4>Notas</h4>
                            <p>${usuario.notas || 'No hay notas disponibles.'}</p>
                        </div>
                    </div>
                    
                    <div class="modal-actions">
                        <button class="btn-secondary" id="close-details">Cerrar</button>
                        <button class="btn-primary" onclick="editUsuario('${usuario.id}')">Editar</button>
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

// Editar usuario
function editUsuario(usuarioId) {
    // Cerrar modal de detalles si está abierto
    closeModal();
    
    // Mostrar formulario de edición
    showUsuarioForm(usuarioId);
}

// Cambiar estado de usuario (activar/desactivar)
function toggleUsuarioStatus(usuarioId) {
    const usuario = usuariosData.find(u => u.id === usuarioId);
    
    if (!usuario) {
        showNotification('Error', 'Usuario no encontrado', 'error');
        return;
    }
    
    const newStatus = usuario.status === 'active' ? 'inactive' : 'active';
    const actionText = newStatus === 'active' ? 'activar' : 'desactivar';
    
    // Confirmar acción
    if (confirm(`¿Está seguro que desea ${actionText} al usuario "${usuario.nombre}"?`)) {
        db.collection('usuarios').doc(usuarioId).update({
            status: newStatus,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        })
        .then(() => {
            loadUsuarios();
            showNotification(
                'Usuario actualizado',
                `El usuario "${usuario.nombre}" ha sido ${newStatus === 'active' ? 'activado' : 'desactivado'} correctamente.`,
                'success'
            );
        })
        .catch(error => {
            console.error(`Error al ${actionText} usuario:`, error);
            showNotification('Error', `No se pudo ${actionText} al usuario: ${error.message}`, 'error');
        });
    }
}