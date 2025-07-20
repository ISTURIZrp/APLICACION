// Verificar autenticación
auth.onAuthStateChanged(user => {
    if (user) {
        // Cargar datos del usuario
        loadUserData(user.uid);
        
        // Cargar plantillas
        if (document.querySelector('.sidebar-content')) {
            loadSidebar();
        }
        
        // Actualizar fecha actual
        updateCurrentDate();
        
        // Inicializar eventos globales
        initGlobalEvents();
    }
});

// Cargar datos del usuario
function loadUserData(userId) {
    db.collection('usuarios').doc(userId).get()
        .then(doc => {
            if (doc.exists) {
                const userData = doc.data();
                
                // Actualizar información del usuario en la UI
                const userNameElements = document.querySelectorAll('.user-name');
                const userRoleElements = document.querySelectorAll('.user-role');
                const userAvatarElements = document.querySelectorAll('.user-avatar');
                
                userNameElements.forEach(el => {
                    el.textContent = userData.nombre || 'Usuario';
                });
                
                userRoleElements.forEach(el => {
                    el.textContent = getRoleName(userData.role) || 'Usuario';
                });
                
                userAvatarElements.forEach(el => {
                    if (userData.photoURL) {
                        el.innerHTML = `<img src="${userData.photoURL}" alt="${userData.nombre}">`;
                    } else {
                        // Iniciales del nombre
                        const initials = getInitials(userData.nombre || 'Usuario');
                        el.innerHTML = `<span>${initials}</span>`;
                    }
                });
            }
        })
        .catch(error => {
            console.error("Error al cargar datos del usuario:", error);
        });
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

// Obtener nombre del rol
function getRoleName(role) {
    switch(role) {
        case 'admin': return 'Administrador';
        case 'supervisor': return 'Supervisor';
        case 'tecnico': return 'Técnico';
        case 'viewer': return 'Visualizador';
        default: return 'Usuario';
    }
}

// Cargar sidebar
function loadSidebar() {
    fetch('plantillas/sidebar.html')
        .then(response => {
            if (!response.ok) {
                throw new Error('No se pudo cargar la plantilla del sidebar');
            }
            return response.text();
        })
        .then(data => {
            document.querySelector('.sidebar-content').innerHTML = data;
            
            // Marcar el elemento activo según la página actual
            const currentPage = window.location.pathname.split('/').pop();
            const menuItems = document.querySelectorAll('.sidebar-menu-link');
            
            menuItems.forEach(item => {
                const itemPage = item.getAttribute('href');
                if (itemPage === currentPage) {
                    item.classList.add('active');
                }
                
                // Prevenir la navegación si ya estamos en la página
                item.addEventListener('click', function(e) {
                    if (itemPage === currentPage) {
                        e.preventDefault();
                    }
                });
            });
        })
        .catch(error => {
            console.error("Error al cargar el sidebar:", error);
            document.querySelector('.sidebar-content').innerHTML = `<div class="error-message">Error al cargar el menú: ${error.message}</div>`;
        });
}

// Actualizar fecha actual
function updateCurrentDate() {
    const currentDateElement = document.getElementById('current-date');
    if (currentDateElement) {
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const today = new Date();
        currentDateElement.textContent = today.toLocaleDateString('es-ES', options);
    }
}

// Inicializar eventos globales
function initGlobalEvents() {
    // Alternar entre modos oscuro y claro
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }
    
    // Colapsar/expandir sidebar
    const collapseSidebar = document.getElementById('collapse-sidebar');
    if (collapseSidebar) {
        collapseSidebar.addEventListener('click', () => {
            document.querySelector('.app-container').classList.toggle('collapsed-sidebar');
        });
    }
    
    // Cerrar sesión
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            auth.signOut().then(() => {
                window.location.href = 'index.html';
            }).catch(error => {
                console.error("Error al cerrar sesión:", error);
                alert("Error al cerrar sesión: " + error.message);
            });
        });
    }
}

// Alternar entre modos oscuro y claro
function toggleTheme() {
    const body = document.body;
    
    if (body.classList.contains('light-mode')) {
        body.classList.remove('light-mode');
        body.classList.add('dark-mode');
        localStorage.setItem('theme', 'dark');
    } else {
        body.classList.remove('dark-mode');
        body.classList.add('light-mode');
        localStorage.setItem('theme', 'light');
    }
}

// Cargar preferencia de tema al iniciar
document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('theme');
    
    if (savedTheme === 'dark') {
        document.body.classList.remove('light-mode');
        document.body.classList.add('dark-mode');
    } else {
        document.body.classList.remove('dark-mode');
        document.body.classList.add('light-mode');
    }
});

// Mostrar notificación
function showNotification(title, message, type = 'info') {
    // Verificar si existe el contenedor de notificaciones, si no, crearlo
    let notificationContainer = document.getElementById('notification-container');
    if (!notificationContainer) {
        notificationContainer = document.createElement('div');
        notificationContainer.id = 'notification-container';
        notificationContainer.className = 'notification-container';
        document.body.appendChild(notificationContainer);
    }
    
    // Crear la notificación
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    
    // Determinar icono según tipo
    let icon;
    switch(type) {
        case 'success': icon = 'check-circle'; break;
        case 'error': icon = 'alert-circle'; break;
        case 'warning': icon = 'alert'; break;
        default: icon = 'information'; break;
    }
    
    notification.innerHTML = `
        <div class="notification-icon">
            <i class="mdi mdi-${icon}"></i>
        </div>
        <div class="notification-content">
            <div class="notification-title">${title}</div>
            <div class="notification-message">${message}</div>
        </div>
        <button class="notification-close">
            <i class="mdi mdi-close"></i>
        </button>
    `;
    
    // Agregar al contenedor
    notificationContainer.appendChild(notification);
    
    // Mostrar con animación
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // Configurar evento para cerrar
    notification.querySelector('.notification-close').addEventListener('click', () => {
        closeNotification(notification);
    });
    
    // Auto-cerrar después de 5 segundos
    setTimeout(() => {
        closeNotification(notification);
    }, 5000);
}

// Cerrar notificación
function closeNotification(notification) {
    notification.classList.remove('show');
    notification.classList.add('hide');
    
    // Eliminar del DOM después de la animación
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
    }, 300);
}