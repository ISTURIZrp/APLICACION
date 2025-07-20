// Variables globales
let isMobileView = window.innerWidth <= 768;
let currentUser = null;

// Verificar autenticación
auth.onAuthStateChanged(user => {
    if (user) {
        // Guardar usuario actual
        currentUser = user;
        
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
        
        // Inicializar eventos específicos para dispositivos móviles
        initMobileEvents();
        
        // Inicializar tema
        initTheme();
    } else {
        // Redirigir a login si no está en la página de login
        if (!window.location.pathname.includes('index.html') && !window.location.pathname.endsWith('/')) {
            window.location.href = 'index.html';
        }
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
                
                // Actualizar última conexión
                db.collection('usuarios').doc(userId).update({
                    lastLogin: firebase.firestore.FieldValue.serverTimestamp()
                }).catch(error => {
                    console.error("Error al actualizar última conexión:", error);
                });
            }
        })
        .catch(error => {
            console.error("Error al cargar datos del usuario:", error);
            showNotification('Error', 'No se pudieron cargar los datos del usuario', 'error');
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
            const currentPage = window.location.pathname.split('/').pop() || 'home.html';
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
                
                // Efecto hover
                item.addEventListener('mouseenter', function() {
                    if (!this.classList.contains('active')) {
                        this.style.transform = 'translateX(4px)';
                    }
                });
                
                item.addEventListener('mouseleave', function() {
                    if (!this.classList.contains('active')) {
                        this.style.transform = 'translateX(0)';
                    }
                });
            });
            
            // Inicializar sidebar
            initSidebar();
            
            // Actualizar badges
            updateSidebarBadges();
        })
        .catch(error => {
            console.error("Error al cargar el sidebar:", error);
            document.querySelector('.sidebar-content').innerHTML = `<div class="error-message">Error al cargar el menú: ${error.message}</div>`;
        });
}

// Actualizar badges del sidebar con datos reales
function updateSidebarBadges() {
    // Actualizar badge de insumos con stock bajo
    db.collection('insumos')
        .where('stockActual', '<', 10)
        .get()
        .then(snapshot => {
            const insumosCount = snapshot.size;
            const insumosLink = document.querySelector('a[href="insumos.html"] .sidebar-badge');
            if (insumosLink) {
                insumosLink.textContent = insumosCount;
                insumosLink.style.display = insumosCount > 0 ? 'inline-flex' : 'none';
            }
        })
        .catch(error => {
            console.error("Error al obtener conteo de insumos:", error);
        });
    
    // Actualizar badge de pedidos pendientes
    db.collection('pedidos')
        .where('estado', '==', 'pendiente')
        .get()
        .then(snapshot => {
            const pedidosCount = snapshot.size;
            const pedidosLink = document.querySelector('a[href="pedidos.html"] .sidebar-badge');
            if (pedidosLink) {
                pedidosLink.textContent = pedidosCount;
                pedidosLink.style.display = pedidosCount > 0 ? 'inline-flex' : 'none';
            }
        })
        .catch(error => {
            console.error("Error al obtener conteo de pedidos:", error);
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
    
    // Cerrar sesión
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            // Animación al hacer clic
            logoutBtn.classList.add('pulse-animation');
            
            // Mostrar confirmación
            if (confirm('¿Está seguro que desea cerrar sesión?')) {
                auth.signOut().then(() => {
                    window.location.href = 'index.html';
                }).catch(error => {
                    console.error("Error al cerrar sesión:", error);
                    showNotification('Error', 'No se pudo cerrar sesión: ' + error.message, 'error');
                });
            } else {
                // Quitar animación después de un momento
                setTimeout(() => {
                    logoutBtn.classList.remove('pulse-animation');
                }, 300);
            }
        });
    }
    
    // Manejar notificaciones
    const notificationsBtn = document.getElementById('notifications-btn');
    if (notificationsBtn) {
        notificationsBtn.addEventListener('click', showNotificationsPanel);
    }
}

// Función para inicializar el sidebar
function initSidebar() {
    // Colapsar/expandir sidebar (sólo en desktop)
    const collapseSidebar = document.getElementById('collapse-sidebar');
    if (collapseSidebar) {
        collapseSidebar.addEventListener('click', () => {
            if (!isMobileView) {
                // En desktop, colapsar/expandir el sidebar
                const sidebar = document.getElementById('sidebar');
                sidebar.classList.toggle('collapsed');
                
                // Guardar preferencia
                const isCollapsed = sidebar.classList.contains('collapsed');
                localStorage.setItem('sidebarCollapsed', isCollapsed);
                
                // Actualizar icono
                const icon = collapseSidebar.querySelector('i');
                if (icon) {
                    if (isCollapsed) {
                        icon.classList.remove('mdi-menu-open');
                        icon.classList.add('mdi-menu');
                    } else {
                        icon.classList.remove('mdi-menu');
                        icon.classList.add('mdi-menu-open');
                    }
                }
            } else {
                // En móvil, mostrar/ocultar el sidebar
                toggleMobileSidebar();
            }
        });
    }
    
    // Recuperar estado del sidebar
    const savedCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';
    const sidebar = document.getElementById('sidebar');
    
    if (sidebar && !isMobileView && savedCollapsed) {
        sidebar.classList.add('collapsed');
        
        // Actualizar icono
        const icon = document.querySelector('#collapse-sidebar i');
        if (icon) {
            icon.classList.remove('mdi-menu-open');
            icon.classList.add('mdi-menu');
        }
    }
}

// Inicializar eventos para dispositivos móviles
function initMobileEvents() {
    // Crear overlay para sidebar si no existe
    if (!document.querySelector('.sidebar-overlay')) {
        const sidebarOverlay = document.createElement('div');
        sidebarOverlay.className = 'sidebar-overlay';
        document.body.appendChild(sidebarOverlay);
        
        // Evento para cerrar sidebar al hacer clic en overlay
        sidebarOverlay.addEventListener('click', () => {
            toggleMobileSidebar(false);
        });
    }
    
    // Crear botón de menú móvil si no existe y estamos en vista móvil
    if (!document.querySelector('.mobile-menu-btn') && isMobileView) {
        const menuButton = document.createElement('button');
        menuButton.className = 'mobile-menu-btn';
        menuButton.innerHTML = '<i class="mdi mdi-menu"></i>';
        menuButton.setAttribute('title', 'Menú');
        
        const topBar = document.querySelector('.top-bar');
        if (topBar) {
            topBar.insertBefore(menuButton, topBar.firstChild);
            
            // Evento para abrir sidebar en móvil
            menuButton.addEventListener('click', () => {
                toggleMobileSidebar(true);
            });
        }
    }
    
    // Crear botón de búsqueda móvil si no existe y estamos en vista móvil
    if (!document.querySelector('.mobile-search-btn') && isMobileView) {
        const searchButton = document.createElement('button');
        searchButton.className = 'mobile-search-btn';
        searchButton.innerHTML = '<i class="mdi mdi-magnify"></i>';
        searchButton.setAttribute('title', 'Buscar');
        
        const topBarActions = document.querySelector('.top-bar-actions');
        if (topBarActions) {
            topBarActions.insertBefore(searchButton, topBarActions.firstChild);
            
            // Evento para mostrar/ocultar búsqueda en móvil
            searchButton.addEventListener('click', toggleMobileSearch);
        }
    }
    
    // Cerrar sidebar al hacer clic en un enlace (en móvil)
    const sidebarLinks = document.querySelectorAll('.sidebar-menu-link');
    sidebarLinks.forEach(link => {
        link.addEventListener('click', function() {
            if (isMobileView) {
                toggleMobileSidebar(false);
            }
        });
    });
    
    // Crear barra de navegación para PWA si es necesario
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) {
        createPWANavBar();
    }
    
    // Ajustar UI al cambiar tamaño de ventana
    window.addEventListener('resize', handleWindowResize);
}

// Alternar sidebar en móvil
function toggleMobileSidebar(show) {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.querySelector('.sidebar-overlay');
    
    if (sidebar && overlay) {
        if (show === undefined) {
            // Alternar
            sidebar.classList.toggle('active');
            overlay.classList.toggle('active');
        } else if (show) {
            // Mostrar
            sidebar.classList.add('active');
            overlay.classList.add('active');
        } else {
            // Ocultar
            sidebar.classList.remove('active');
            overlay.classList.remove('active');
        }
    }
}

// Alternar búsqueda en móvil
function toggleMobileSearch() {
    const searchContainer = document.querySelector('.search-container');
    
    if (searchContainer) {
        searchContainer.classList.toggle('active');
        
        if (searchContainer.classList.contains('active')) {
            // Enfocar el campo de búsqueda
            const searchInput = searchContainer.querySelector('input');
            if (searchInput) {
                searchInput.focus();
                
                // Agregar evento para cerrar al presionar Escape
                searchInput.addEventListener('keydown', function(e) {
                    if (e.key === 'Escape') {
                        searchContainer.classList.remove('active');
                    }
                });
            }
        }
    }
}

// Mostrar panel de notificaciones
function showNotificationsPanel() {
    // Crear panel de notificaciones si no existe
    if (!document.querySelector('.notifications-panel')) {
        const panel = document.createElement('div');
        panel.className = 'notifications-panel';
        
        // Contenido del panel
        panel.innerHTML = `
            <div class="notifications-header">
                <h3>Notificaciones</h3>
                <button class="close-panel-btn">
                    <i class="mdi mdi-close"></i>
                </button>
            </div>
            <div class="notifications-content">
                <div class="notifications-loading">
                    <i class="mdi mdi-loading mdi-spin"></i>
                    <p>Cargando notificaciones...</p>
                </div>
            </div>
        `;
        
        document.body.appendChild(panel);
        
        // Evento para cerrar panel
        panel.querySelector('.close-panel-btn').addEventListener('click', () => {
            panel.classList.remove('active');
            setTimeout(() => {
                panel.remove();
            }, 300);
        });
        
        // Cargar notificaciones
        loadNotifications(panel.querySelector('.notifications-content'));
        
        // Mostrar panel con animación
        setTimeout(() => {
            panel.classList.add('active');
        }, 10);
    }
}

// Cargar notificaciones
function loadNotifications(container) {
    if (!currentUser) return;
    
    db.collection('notificaciones')
        .where('userId', '==', currentUser.uid)
        .orderBy('createdAt', 'desc')
        .limit(10)
        .get()
        .then(snapshot => {
            if (snapshot.empty) {
                container.innerHTML = `
                    <div class="no-notifications">
                        <i class="mdi mdi-bell-off-outline"></i>
                        <p>No tienes notificaciones</p>
                    </div>
                `;
                return;
            }
            
            let notificationsHTML = `
                <div class="notifications-list">
            `;
            
            snapshot.forEach(doc => {
                const notification = doc.data();
                const date = notification.createdAt ? notification.createdAt.toDate() : new Date();
                const formattedDate = formatRelativeTime(date);
                
                let iconClass = 'mdi-information-outline';
                let typeClass = '';
                
                switch(notification.type) {
                    case 'success':
                        iconClass = 'mdi-check-circle-outline';
                        typeClass = 'notification-success';
                        break;
                    case 'warning':
                        iconClass = 'mdi-alert-outline';
                        typeClass = 'notification-warning';
                        break;
                    case 'error':
                        iconClass = 'mdi-alert-circle-outline';
                        typeClass = 'notification-error';
                        break;
                }
                
                notificationsHTML += `
                    <div class="notification-item ${typeClass} ${notification.read ? 'read' : ''}">
                        <div class="notification-icon">
                            <i class="mdi ${iconClass}"></i>
                        </div>
                        <div class="notification-content">
                            <p class="notification-title">${notification.title}</p>
                            <p class="notification-message">${notification.message}</p>
                            <p class="notification-time">${formattedDate}</p>
                        </div>
                        ${!notification.read ? `
                            <button class="mark-read-btn" data-id="${doc.id}">
                                <i class="mdi mdi-check"></i>
                            </button>
                        ` : ''}
                    </div>
                `;
            });
            
            notificationsHTML += `
                </div>
                <div class="notifications-footer">
                    <a href="notificaciones.html" class="view-all-link">Ver todas las notificaciones</a>
                </div>
            `;
            
            container.innerHTML = notificationsHTML;
            
            // Evento para marcar como leída
            const markReadBtns = container.querySelectorAll('.mark-read-btn');
            markReadBtns.forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const notificationId = btn.getAttribute('data-id');
                    markNotificationAsRead(notificationId, btn.closest('.notification-item'));
                });
            });
        })
        .catch(error => {
            console.error("Error al cargar notificaciones:", error);
            container.innerHTML = `
                <div class="notifications-error">
                    <i class="mdi mdi-alert-circle-outline"></i>
                    <p>Error al cargar notificaciones</p>
                </div>
            `;
        });
}

// Marcar notificación como leída
function markNotificationAsRead(notificationId, element) {
    db.collection('notificaciones').doc(notificationId).update({
        read: true,
        readAt: firebase.firestore.FieldValue.serverTimestamp()
    })
    .then(() => {
        // Actualizar UI
        if (element) {
            element.classList.add('read');
            const markReadBtn = element.querySelector('.mark-read-btn');
            if (markReadBtn) markReadBtn.remove();
        }
        
        // Actualizar contador de notificaciones
        updateNotificationCount();
    })
    .catch(error => {
        console.error("Error al marcar notificación como leída:", error);
        showNotification('Error', 'No se pudo marcar la notificación como leída', 'error');
    });
}

// Actualizar contador de notificaciones
function updateNotificationCount() {
    if (!currentUser) return;
    
    db.collection('notificaciones')
        .where('userId', '==', currentUser.uid)
        .where('read', '==', false)
        .get()
        .then(snapshot => {
            const count = snapshot.size;
            
            // Actualizar badge
            const badge = document.querySelector('.notification-badge');
            if (badge) {
                badge.textContent = count;
                badge.style.display = count > 0 ? 'flex' : 'none';
            }
        })
        .catch(error => {
            console.error("Error al obtener conteo de notificaciones:", error);
        });
}

// Formatear tiempo relativo
function formatRelativeTime(date) {
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) {
        return 'Hace un momento';
    }
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
        return `Hace ${diffInMinutes} ${diffInMinutes === 1 ? 'minuto' : 'minutos'}`;
    }
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
        return `Hace ${diffInHours} ${diffInHours === 1 ? 'hora' : 'horas'}`;
    }
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) {
        return `Hace ${diffInDays} ${diffInDays === 1 ? 'día' : 'días'}`;
    }
    
    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) {
        return `Hace ${diffInMonths} ${diffInMonths === 1 ? 'mes' : 'meses'}`;
    }
    
    const diffInYears = Math.floor(diffInMonths / 12);
    return `Hace ${diffInYears} ${diffInYears === 1 ? 'año' : 'años'}`;
}

// Manejar cambio de tamaño de ventana
function handleWindowResize() {
    const newIsMobileView = window.innerWidth <= 768;
    
    // Si cambió el tipo de vista
    if (newIsMobileView !== isMobileView) {
        isMobileView = newIsMobileView;
        
        if (isMobileView) {
            // Cambiar a vista móvil
            
            // Crear botón de menú si no existe
            if (!document.querySelector('.mobile-menu-btn')) {
                const menuButton = document.createElement('button');
                menuButton.className = 'mobile-menu-btn';
                menuButton.innerHTML = '<i class="mdi mdi-menu"></i>';
                menuButton.setAttribute('title', 'Menú');
                
                const topBar = document.querySelector('.top-bar');
                if (topBar) {
                    topBar.insertBefore(menuButton, topBar.firstChild);
                    
                    // Evento para abrir sidebar en móvil
                    menuButton.addEventListener('click', () => {
                        toggleMobileSidebar(true);
                    });
                }
            }
            
            // Crear botón de búsqueda si no existe
            if (!document.querySelector('.mobile-search-btn')) {
                const searchButton = document.createElement('button');
                searchButton.className = 'mobile-search-btn';
                searchButton.innerHTML = '<i class="mdi mdi-magnify"></i>';
                searchButton.setAttribute('title', 'Buscar');
                
                const topBarActions = document.querySelector('.top-bar-actions');
                if (topBarActions) {
                    topBarActions.insertBefore(searchButton, topBarActions.firstChild);
                    
                    // Evento para mostrar/ocultar búsqueda en móvil
                    searchButton.addEventListener('click', toggleMobileSearch);
                }
            }
        } else {
            // Cambiar a vista desktop
            
            // Eliminar botón de menú móvil
            const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
            if (mobileMenuBtn) {
                mobileMenuBtn.remove();
            }
            
            // Eliminar botón de búsqueda móvil
            const mobileSearchBtn = document.querySelector('.mobile-search-btn');
            if (mobileSearchBtn) {
                mobileSearchBtn.remove();
            }
            
            // Restaurar sidebar
            const sidebar = document.getElementById('sidebar');
            if (sidebar) {
                sidebar.classList.remove('active');
            }
            
            // Ocultar overlay
            const overlay = document.querySelector('.sidebar-overlay');
            if (overlay) {
                overlay.classList.remove('active');
            }
            
            // Restaurar búsqueda
            const searchContainer = document.querySelector('.search-container');
            if (searchContainer) {
                searchContainer.classList.remove('active');
            }
        }
    }
}

// Crear barra de navegación para PWA
function createPWANavBar() {
    if (document.querySelector('.pwa-nav-bar')) return;
    
    const navBar = document.createElement('div');
    navBar.className = 'pwa-nav-bar';
    
    const navItems = [
        { icon: 'mdi-view-dashboard-outline', text: 'Inicio', url: 'home.html' },
        { icon: 'mdi-flask-outline', text: 'Insumos', url: 'insumos.html' },
        { icon: 'mdi-microscope', text: 'Equipos', url: 'equipos.html' },
        { icon: 'mdi-swap-horizontal', text: 'Movimientos', url: 'movimientos.html' },
        { icon: 'mdi-account-outline', text: 'Perfil', url: 'profile.html' }
    ];
    
    const currentPage = window.location.pathname.split('/').pop() || 'home.html';
    
    navItems.forEach(item => {
        const navItem = document.createElement('a');
        navItem.className = 'pwa-nav-item';
        if (currentPage === item.url) {
            navItem.classList.add('active');
        }
        navItem.href = item.url;
        
        navItem.innerHTML = `
            <i class="pwa-nav-icon mdi ${item.icon}"></i>
            <span class="pwa-nav-text">${item.text}</span>
        `;
        
        navBar.appendChild(navItem);
    });
    
    document.body.appendChild(navBar);
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
    
    // Añadir efecto de transición
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.classList.add('pulse-animation');
        setTimeout(() => {
            themeToggle.classList.remove('pulse-animation');
        }, 500);
    }
}

// Cargar preferencia de tema al iniciar
function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    
    if (savedTheme === 'dark') {
        document.body.classList.remove('light-mode');
        document.body.classList.add('dark-mode');
    } else {
        document.body.classList.remove('dark-mode');
        document.body.classList.add('light-mode');
    }
}

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
    
    // Guardar notificación en Firestore si el usuario está autenticado
    if (currentUser && type !== 'info') {
        db.collection('notificaciones').add({
            userId: currentUser.uid,
            title: title,
            message: message,
            type: type,
            read: false,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        }).catch(error => {
            console.error("Error al guardar notificación:", error);
        });
        
        // Actualizar contador de notificaciones
        updateNotificationCount();
    }
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

// Registrar Service Worker para soporte offline
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js')
                .then(registration => {
                    console.log('Service Worker registrado con éxito:', registration.scope);
                })
                .catch(error => {
                    console.log('Error al registrar el Service Worker:', error);
                });
        });
    }
}

// Función para abrir modales
function openModal(content, options = {}) {
    // Opciones por defecto
    const defaultOptions = {
        title: 'Modal',
        size: 'medium', // small, medium, large, fullscreen
        closeOnClickOutside: true,
        showCloseButton: true,
        onClose: null
    };
    
    const modalOptions = { ...defaultOptions, ...options };
    
    // Crear modal
    const modalOverlay = document.createElement('div');
    modalOverlay.className = `modal-overlay ${modalOptions.size}`;
    
    modalOverlay.innerHTML = `
        <div class="modal-container">
            <div class="modal-header">
                <h3>${modalOptions.title}</h3>
                ${modalOptions.showCloseButton ? '<button class="modal-close-btn"><i class="mdi mdi-close"></i></button>' : ''}
            </div>
            <div class="modal-body"></div>
        </div>
    `;
    
    // Agregar contenido
    const modalBody = modalOverlay.querySelector('.modal-body');
    if (typeof content === 'string') {
        modalBody.innerHTML = content;
    } else if (content instanceof HTMLElement) {
        modalBody.appendChild(content);
    }
    
    // Agregar al DOM
    document.body.appendChild(modalOverlay);
    
    // Mostrar con animación
    setTimeout(() => {
        modalOverlay.classList.add('active');
    }, 10);
    
    // Evento para cerrar modal
    if (modalOptions.showCloseButton) {
        const closeBtn = modalOverlay.querySelector('.modal-close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => closeModal(modalOverlay, modalOptions.onClose));
        }
    }
    
    // Cerrar al hacer clic fuera
    if (modalOptions.closeOnClickOutside) {
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                closeModal(modalOverlay, modalOptions.onClose);
            }
        });
    }
    
    // Cerrar con la tecla Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeModal(modalOverlay, modalOptions.onClose);
        }
    });
    
    // Devolver referencia al modal
    return modalOverlay;
}

// Cerrar modal
function closeModal(modal, callback) {
    if (!modal) return;
    
    modal.classList.remove('active');
    modal.classList.add('closing');
    
    setTimeout(() => {
        if (modal.parentNode) {
            modal.parentNode.removeChild(modal);
            
            // Ejecutar callback si existe
            if (typeof callback === 'function') {
                callback();
            }
        }
    }, 300);
}

// Función para mostrar confirmación
function showConfirmation(title, message, onConfirm, onCancel) {
    const content = `
        <div class="confirmation-dialog">
            <div class="confirmation-icon">
                <i class="mdi mdi-help-circle-outline"></i>
            </div>
            <div class="confirmation-content">
                <p>${message}</p>
            </div>
            <div class="confirmation-actions">
                <button class="btn-secondary" id="cancel-btn">Cancelar</button>
                <button class="btn-primary" id="confirm-btn">Confirmar</button>
            </div>
        </div>
    `;
    
    const modal = openModal(content, {
        title: title,
        size: 'small',
        closeOnClickOutside: false
    });
    
    // Configurar eventos
    const confirmBtn = modal.querySelector('#confirm-btn');
    const cancelBtn = modal.querySelector('#cancel-btn');
    
    confirmBtn.addEventListener('click', () => {
        closeModal(modal);
        if (typeof onConfirm === 'function') {
            onConfirm();
        }
    });
    
    cancelBtn.addEventListener('click', () => {
        closeModal(modal);
        if (typeof onCancel === 'function') {
            onCancel();
        }
    });
}

// Función para mostrar diálogo de alerta
function showAlert(title, message, type = 'info', onClose) {
    let icon;
    switch(type) {
        case 'success': icon = 'check-circle-outline'; break;
        case 'error': icon = 'alert-circle-outline'; break;
        case 'warning': icon = 'alert-outline'; break;
        default: icon = 'information-outline'; break;
    }
    
    const content = `
        <div class="alert-dialog">
            <div class="alert-icon alert-${type}">
                <i class="mdi mdi-${icon}"></i>
            </div>
            <div class="alert-content">
                <p>${message}</p>
            </div>
            <div class="alert-actions">
                <button class="btn-primary" id="ok-btn">Aceptar</button>
            </div>
        </div>
    `;
    
    const modal = openModal(content, {
        title: title,
        size: 'small',
        closeOnClickOutside: false,
        onClose: onClose
    });
    
    // Configurar evento
    const okBtn = modal.querySelector('#ok-btn');
    okBtn.addEventListener('click', () => {
        closeModal(modal, onClose);
    });
}

// Función para validar formularios
function validateForm(formId, rules) {
    const form = document.getElementById(formId);
    if (!form) return false;
    
    let isValid = true;
    const errors = {};
    
    // Recorrer reglas
    for (const field in rules) {
        const element = form.elements[field];
        if (!element) continue;
        
        const fieldRules = rules[field];
        const value = element.value.trim();
        let fieldError = null;
        
        // Validar requerido
        if (fieldRules.required && value === '') {
            fieldError = fieldRules.requiredMessage || 'Este campo es obligatorio';
        }
        // Validar longitud mínima
        else if (fieldRules.minLength && value.length < fieldRules.minLength) {
            fieldError = fieldRules.minLengthMessage || `Debe tener al menos ${fieldRules.minLength} caracteres`;
        }
        // Validar longitud máxima
        else if (fieldRules.maxLength && value.length > fieldRules.maxLength) {
            fieldError = fieldRules.maxLengthMessage || `Debe tener como máximo ${fieldRules.maxLength} caracteres`;
        }
        // Validar patrón
        else if (fieldRules.pattern && !fieldRules.pattern.test(value)) {
            fieldError = fieldRules.patternMessage || 'El formato no es válido';
        }
        // Validar email
        else if (fieldRules.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            fieldError = fieldRules.emailMessage || 'Debe ser un email válido';
        }
        // Validar número
        else if (fieldRules.number && isNaN(value)) {
            fieldError = fieldRules.numberMessage || 'Debe ser un número válido';
        }
        // Validar mínimo
        else if (fieldRules.min && parseFloat(value) < fieldRules.min) {
            fieldError = fieldRules.minMessage || `Debe ser mayor o igual a ${fieldRules.min}`;
        }
        // Validar máximo
        else if (fieldRules.max && parseFloat(value) > fieldRules.max) {
            fieldError = fieldRules.maxMessage || `Debe ser menor o igual a ${fieldRules.max}`;
        }
        // Validación personalizada
        else if (fieldRules.validate && typeof fieldRules.validate === 'function') {
            const customError = fieldRules.validate(value, form);
            if (customError) {
                fieldError = customError;
            }
        }
        
        // Si hay error, mostrar y marcar campo
        if (fieldError) {
            isValid = false;
            errors[field] = fieldError;
            
            // Marcar campo con error
            element.classList.add('error');
            
            // Mostrar mensaje de error
            let errorElement = document.getElementById(`${field}-error`);
            if (!errorElement) {
                errorElement = document.createElement('div');
                errorElement.id = `${field}-error`;
                errorElement.className = 'error-message';
                element.parentNode.appendChild(errorElement);
            }
            errorElement.textContent = fieldError;
        } else {
            // Quitar marca de error
            element.classList.remove('error');
            
            // Quitar mensaje de error
            const errorElement = document.getElementById(`${field}-error`);
            if (errorElement) {
                errorElement.remove();
            }
        }
    }
    
    return { isValid, errors };
}

// Función para formatear fechas
function formatDate(date, format = 'dd/MM/yyyy') {
    if (!date) return '';
    
    if (typeof date === 'string') {
        date = new Date(date);
    }
    
    if (date instanceof firebase.firestore.Timestamp) {
        date = date.toDate();
    }
    
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');
    
    return format
        .replace('dd', day)
        .replace('MM', month)
        .replace('yyyy', year)
        .replace('HH', hours)
        .replace('mm', minutes)
        .replace('ss', seconds);
}

// Función para formatear números
function formatNumber(number, decimals = 0, decimalSeparator = ',', thousandsSeparator = '.') {
    if (number === null || number === undefined) return '';
    
    const fixed = parseFloat(number).toFixed(decimals);
    const parts = fixed.split('.');
    const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, thousandsSeparator);
    
    if (decimals === 0) return integerPart;
    
    return integerPart + decimalSeparator + (parts[1] || '0'.repeat(decimals));
}

// Función para mostrar/ocultar loader
function toggleLoader(show, message = 'Cargando...') {
    let loader = document.getElementById('global-loader');
    
    if (show) {
        if (!loader) {
            loader = document.createElement('div');
            loader.id = 'global-loader';
            loader.className = 'global-loader';
            loader.innerHTML = `
                <div class="loader-content">
                    <div class="loader-spinner">
                        <i class="mdi mdi-loading mdi-spin"></i>
                    </div>
                    <p class="loader-message">${message}</p>
                </div>
            `;
            document.body.appendChild(loader);
        } else {
            loader.querySelector('.loader-message').textContent = message;
            loader.style.display = 'flex';
        }
        
        // Mostrar con animación
        setTimeout(() => {
            loader.classList.add('active');
        }, 10);
    } else if (loader) {
        loader.classList.remove('active');
        
        // Ocultar después de la animación
        setTimeout(() => {
            loader.style.display = 'none';
        }, 300);
    }
}

// Función para copiar al portapapeles
function copyToClipboard(text) {
    // Crear elemento temporal
    const el = document.createElement('textarea');
    el.value = text;
    el.setAttribute('readonly', '');
    el.style.position = 'absolute';
    el.style.left = '-9999px';
    document.body.appendChild(el);
    
    // Seleccionar y copiar
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    
    // Mostrar notificación
    showNotification('Copiado', 'Texto copiado al portapapeles', 'success');
}

// Función para exportar a CSV
function exportToCSV(data, filename = 'export.csv') {
    if (!data || !data.length) {
        showNotification('Error', 'No hay datos para exportar', 'error');
        return;
    }
    
    // Obtener encabezados
    const headers = Object.keys(data[0]);
    
    // Crear contenido CSV
    let csvContent = headers.join(',') + '\n';
    
    data.forEach(item => {
        const row = headers.map(header => {
            let value = item[header];
            
            // Formatear fechas
            if (value instanceof Date || value instanceof firebase.firestore.Timestamp) {
                value = formatDate(value, 'dd/MM/yyyy HH:mm');
            }
            
            // Escapar comillas y formatear
            if (typeof value === 'string') {
                value = value.replace(/"/g, '""');
                if (value.includes(',') || value.includes('"') || value.includes('\n')) {
                    value = `"${value}"`;
                }
            }
            
            return value !== null && value !== undefined ? value : '';
        }).join(',');
        
        csvContent += row + '\n';
    });
    
    // Crear blob y link para descargar
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showNotification('Exportación completada', `Se ha exportado a ${filename}`, 'success');
}

// Inicializar al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    // Inicializar tema
    initTheme();
    
    // Registrar Service Worker
    registerServiceWorker();
    
    // Comprobar si es vista móvil
    isMobileView = window.innerWidth <= 768;
    
    // Inicializar animaciones de entrada
    initEntranceAnimations();
});

// Inicializar animaciones de entrada
function initEntranceAnimations() {
    // Animar elementos al entrar en viewport
    const animateElements = document.querySelectorAll('.animate-on-scroll');
    
    if (animateElements.length > 0) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animated');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });
        
        animateElements.forEach(element => {
            observer.observe(element);
        });
    }
}

// Función para obtener parámetros de URL
function getUrlParams() {
    const params = {};
    const queryString = window.location.search.substring(1);
    const pairs = queryString.split('&');
    
    for (let i = 0; i < pairs.length; i++) {
        if (!pairs[i]) continue;
        
        const pair = pairs[i].split('=');
        params[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1] || '');
    }
    
    return params;
}