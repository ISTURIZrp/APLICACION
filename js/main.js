// Variables globales
let isMobileView = window.innerWidth <= 768;
let currentUser = null;

// Verificar autenticación
document.addEventListener('DOMContentLoaded', () => {
    // Inicializar Firebase (asegúrate de que esto se ejecute primero)
    initFirebase();
    
    // Inicializar tema
    initTheme();
    
    // Comprobar si es vista móvil
    isMobileView = window.innerWidth <= 768;
    
    // Verificar autenticación después de inicializar Firebase
    initAuth();
    
    // Registrar Service Worker
    registerServiceWorker();
});

// Inicializar Firebase
function initFirebase() {
    // Verifica si Firebase ya está inicializado para evitar errores
    if (!firebase.apps.length) {
        // Configuración de Firebase
        const firebaseConfig = {
            apiKey: "AIzaSyCxJOpBEXZUo7WrAqDTrlJV_2kJBsL8Ym0",
            authDomain: "labflow-manager.firebaseapp.com",
            projectId: "labflow-manager",
            storageBucket: "labflow-manager.firebasestorage.app",
            messagingSenderId: "742212306654",
            appId: "1:742212306654:web:a53bf890fc63cd5d05e44f",
            measurementId: "G-YVZDBCJR3B"
        };
        
        // Inicializar Firebase
        firebase.initializeApp(firebaseConfig);
        
        // Inicializar servicios
        window.db = firebase.firestore();
        window.auth = firebase.auth();
        window.storage = firebase.storage();
        
        // Configurar persistencia para funcionamiento offline
        db.enablePersistence({ synchronizeTabs: true })
            .then(() => {
                console.log("Persistencia de Firestore habilitada");
            })
            .catch(err => {
                if (err.code == 'failed-precondition') {
                    console.warn("La persistencia falló debido a múltiples pestañas abiertas");
                } else if (err.code == 'unimplemented') {
                    console.warn("El navegador no soporta persistencia");
                }
            });
        
        console.log("Firebase inicializado correctamente");
    } else {
        // Si ya está inicializado, asignar referencias globales
        window.db = firebase.firestore();
        window.auth = firebase.auth();
        window.storage = firebase.storage();
    }
}

// Inicializar autenticación
function initAuth() {
    // Mostrar loader mientras se verifica la autenticación
    toggleLoader(true, 'Verificando sesión...');
    
    // Escuchar cambios en el estado de autenticación
    auth.onAuthStateChanged(user => {
        if (user) {
            // Usuario autenticado
            console.log("Usuario autenticado:", user.uid);
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
            
        } else {
            // No hay usuario autenticado
            console.log("No hay usuario autenticado");
            
            // Si no estamos en la página de login, redirigir
            if (!window.location.pathname.includes('index.html') && !window.location.pathname.endsWith('/')) {
                window.location.href = 'index.html';
            }
            
            // Ocultar loader
            toggleLoader(false);
        }
    }, error => {
        console.error("Error en la autenticación:", error);
        showNotification('Error', 'Error al verificar la autenticación', 'error');
        toggleLoader(false);
    });
}

// Cargar datos del usuario
function loadUserData(userId) {
    console.log("Cargando datos del usuario:", userId);
    
    db.collection('usuarios').doc(userId).get()
        .then(doc => {
            if (doc.exists) {
                console.log("Datos de usuario obtenidos:", doc.data());
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
                
                // Ocultar loader
                toggleLoader(false);
            } else {
                console.warn("No se encontraron datos del usuario");
                
                // Si no hay datos, podríamos crear un perfil básico
                const user = auth.currentUser;
                if (user) {
                    const newUserData = {
                        nombre: user.displayName || 'Usuario',
                        email: user.email,
                        role: 'viewer', // Rol por defecto
                        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                        lastLogin: firebase.firestore.FieldValue.serverTimestamp()
                    };
                    
                    db.collection('usuarios').doc(userId).set(newUserData)
                        .then(() => {
                            console.log("Perfil de usuario creado");
                            // Ocultar loader
                            toggleLoader(false);
                            // Recargar la página para aplicar los cambios
                            window.location.reload();
                        })
                        .catch(error => {
                            console.error("Error al crear perfil de usuario:", error);
                            toggleLoader(false);
                        });
                } else {
                    toggleLoader(false);
                }
            }
        })
        .catch(error => {
            console.error("Error al cargar datos del usuario:", error);
            showNotification('Error', 'No se pudieron cargar los datos del usuario', 'error');
            toggleLoader(false);
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
    console.log("Cargando sidebar");
    
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
    console.log("Actualizando badges del sidebar");
    
    // Actualizar badge de insumos con stock bajo
    db.collection('insumos')
        .where('stockActual', '<', 10)
        .get()
        .then(snapshot => {
            console.log(`Insumos con stock bajo: ${snapshot.size}`);
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
            console.log(`Pedidos pendientes: ${snapshot.size}`);
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
        { icon: 'mdi-microscope', text:
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

// Cargar datos de insumos (para la página de insumos)
function loadInsumos(container, filters = {}) {
    if (!container) return;
    
    toggleLoader(true, 'Cargando insumos...');
    
    let query = db.collection('insumos');
    
    // Aplicar filtros
    if (filters.categoria) {
        query = query.where('categoria', '==', filters.categoria);
    }
    
    if (filters.stockBajo) {
        query = query.where('stockActual', '<', 10);
    }
    
    // Ordenar
    query = query.orderBy(filters.orderBy || 'nombre', filters.orderDir || 'asc');
    
    query.get()
        .then(snapshot => {
            if (snapshot.empty) {
                container.innerHTML = `
                    <div class="no-data">
                        <i class="mdi mdi-flask-empty-outline"></i>
                        <p>No se encontraron insumos</p>
                    </div>
                `;
                toggleLoader(false);
                return;
            }
            
            const insumos = [];
            snapshot.forEach(doc => {
                insumos.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            
            renderInsumos(container, insumos);
            toggleLoader(false);
        })
        .catch(error => {
            console.error("Error al cargar insumos:", error);
            container.innerHTML = `
                <div class="error-message">
                    <i class="mdi mdi-alert-circle-outline"></i>
                    <p>Error al cargar insumos: ${error.message}</p>
                </div>
            `;
            toggleLoader(false);
        });
}

// Renderizar insumos en el contenedor
function renderInsumos(container, insumos) {
    let html = `
        <div class="insumos-grid">
    `;
    
    insumos.forEach(insumo => {
        // Determinar clase según stock
        let stockClass = '';
        let stockIcon = '';
        
        if (insumo.stockActual <= insumo.stockMinimo) {
            stockClass = 'stock-bajo';
            stockIcon = '<i class="mdi mdi-alert-circle"></i>';
        } else if (insumo.stockActual < insumo.stockOptimo) {
            stockClass = 'stock-medio';
            stockIcon = '<i class="mdi mdi-alert"></i>';
        } else {
            stockClass = 'stock-normal';
            stockIcon = '<i class="mdi mdi-check-circle"></i>';
        }
        
        html += `
            <div class="insumo-card" data-id="${insumo.id}">
                <div class="insumo-header">
                    <h3 class="insumo-nombre">${insumo.nombre}</h3>
                    <span class="insumo-codigo">${insumo.codigo}</span>
                </div>
                <div class="insumo-body">
                    <div class="insumo-info">
                        <p class="insumo-categoria">${insumo.categoria}</p>
                        <p class="insumo-ubicacion">${insumo.ubicacion || 'Sin ubicación'}</p>
                    </div>
                    <div class="insumo-stock ${stockClass}">
                        ${stockIcon}
                        <span>${insumo.stockActual} ${insumo.unidad}</span>
                    </div>
                </div>
                <div class="insumo-footer">
                    <button class="btn-icon ver-insumo" title="Ver detalles">
                        <i class="mdi mdi-eye-outline"></i>
                    </button>
                    <button class="btn-icon editar-insumo" title="Editar">
                        <i class="mdi mdi-pencil-outline"></i>
                    </button>
                    <button class="btn-icon movimiento-insumo" title="Registrar movimiento">
                        <i class="mdi mdi-swap-horizontal"></i>
                    </button>
                </div>
            </div>
        `;
    });
    
    html += `
        </div>
    `;
    
    container.innerHTML = html;
    
    // Eventos para los botones
    container.querySelectorAll('.ver-insumo').forEach(btn => {
        btn.addEventListener('click', () => {
            const insumoId = btn.closest('.insumo-card').getAttribute('data-id');
            verDetallesInsumo(insumoId);
        });
    });
    
    container.querySelectorAll('.editar-insumo').forEach(btn => {
        btn.addEventListener('click', () => {
            const insumoId = btn.closest('.insumo-card').getAttribute('data-id');
            editarInsumo(insumoId);
        });
    });
    
    container.querySelectorAll('.movimiento-insumo').forEach(btn => {
        btn.addEventListener('click', () => {
            const insumoId = btn.closest('.insumo-card').getAttribute('data-id');
            registrarMovimiento(insumoId);
        });
    });
}

// Ver detalles de un insumo
function verDetallesInsumo(insumoId) {
    toggleLoader(true, 'Cargando detalles...');
    
    db.collection('insumos').doc(insumoId).get()
        .then(doc => {
            if (!doc.exists) {
                showNotification('Error', 'No se encontró el insumo', 'error');
                toggleLoader(false);
                return;
            }
            
            const insumo = {
                id: doc.id,
                ...doc.data()
            };
            
            // Cargar últimos movimientos
            db.collection('movimientos')
                .where('insumoId', '==', insumoId)
                .orderBy('fecha', 'desc')
                .limit(5)
                .get()
                .then(snapshot => {
                    const movimientos = [];
                    snapshot.forEach(doc => {
                        movimientos.push({
                            id: doc.id,
                            ...doc.data()
                        });
                    });
                    
                    mostrarDetallesInsumo(insumo, movimientos);
                    toggleLoader(false);
                })
                .catch(error => {
                    console.error("Error al cargar movimientos:", error);
                    mostrarDetallesInsumo(insumo, []);
                    toggleLoader(false);
                });
        })
        .catch(error => {
            console.error("Error al cargar detalles del insumo:", error);
            showNotification('Error', 'No se pudieron cargar los detalles', 'error');
            toggleLoader(false);
        });
}

// Mostrar modal con detalles del insumo
function mostrarDetallesInsumo(insumo, movimientos) {
    // Formatear fecha
    const fechaCreacion = insumo.fechaCreacion ? formatDate(insumo.fechaCreacion, 'dd/MM/yyyy') : 'N/A';
    const fechaActualizacion = insumo.fechaActualizacion ? formatDate(insumo.fechaActualizacion, 'dd/MM/yyyy') : 'N/A';
    
    // Determinar clase según stock
    let stockClass = '';
    let stockText = '';
    
    if (insumo.stockActual <= insumo.stockMinimo) {
        stockClass = 'stock-bajo';
        stockText = 'Stock bajo';
    } else if (insumo.stockActual < insumo.stockOptimo) {
        stockClass = 'stock-medio';
        stockText = 'Stock medio';
    } else {
        stockClass = 'stock-normal';
        stockText = 'Stock normal';
    }
    
    // Crear movimientos HTML
    let movimientosHTML = '';
    if (movimientos.length > 0) {
        movimientosHTML = `
            <div class="insumo-movimientos">
                <h4>Últimos movimientos</h4>
                <div class="movimientos-lista">
        `;
        
        movimientos.forEach(mov => {
            const fecha = formatDate(mov.fecha, 'dd/MM/yyyy HH:mm');
            const tipoClass = mov.tipo === 'entrada' ? 'entrada' : 'salida';
            const cantidad = mov.cantidad + ' ' + insumo.unidad;
            
            movimientosHTML += `
                <div class="movimiento-item">
                    <div class="movimiento-tipo ${tipoClass}">
                        <i class="mdi mdi-${mov.tipo === 'entrada' ? 'arrow-down' : 'arrow-up'}"></i>
                        <span>${mov.tipo === 'entrada' ? 'Entrada' : 'Salida'}</span>
                    </div>
                    <div class="movimiento-info">
                        <p class="movimiento-cantidad">${cantidad}</p>
                        <p class="movimiento-motivo">${mov.motivo}</p>
                    </div>
                    <div class="movimiento-meta">
                    <div class="movimiento-meta">
                        <p class="movimiento-fecha">${fecha}</p>
                        <p class="movimiento-usuario">${mov.usuarioNombre || 'Usuario'}</p>
                    </div>
                </div>
            `;
        });
        
        movimientosHTML += `
                </div>
                <a href="movimientos.html?insumo=${insumo.id}" class="ver-todos-link">Ver todos los movimientos</a>
            </div>
        `;
    } else {
        movimientosHTML = `
            <div class="insumo-movimientos">
                <h4>Últimos movimientos</h4>
                <div class="no-data">
                    <i class="mdi mdi-swap-horizontal"></i>
                    <p>No hay movimientos registrados</p>
                </div>
            </div>
        `;
    }
    
    // Crear contenido del modal
    const content = `
        <div class="insumo-detalle">
            <div class="insumo-detalle-header">
                <div class="insumo-detalle-nombre">
                    <h2>${insumo.nombre}</h2>
                    <span class="insumo-detalle-codigo">${insumo.codigo}</span>
                </div>
                <div class="insumo-detalle-stock ${stockClass}">
                    <span class="stock-valor">${insumo.stockActual} ${insumo.unidad}</span>
                    <span class="stock-estado">${stockText}</span>
                </div>
            </div>
            
            <div class="insumo-detalle-info">
                <div class="info-section">
                    <h3>Información general</h3>
                    <div class="info-grid">
                        <div class="info-item">
                            <span class="info-label">Categoría</span>
                            <span class="info-value">${insumo.categoria}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Ubicación</span>
                            <span class="info-value">${insumo.ubicacion || 'Sin ubicación'}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Proveedor</span>
                            <span class="info-value">${insumo.proveedor || 'Sin proveedor'}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Unidad de medida</span>
                            <span class="info-value">${insumo.unidad}</span>
                        </div>
                    </div>
                </div>
                
                <div class="info-section">
                    <h3>Niveles de stock</h3>
                    <div class="info-grid">
                        <div class="info-item">
                            <span class="info-label">Stock actual</span>
                            <span class="info-value stock-${stockClass}">${insumo.stockActual} ${insumo.unidad}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Stock mínimo</span>
                            <span class="info-value">${insumo.stockMinimo} ${insumo.unidad}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Stock óptimo</span>
                            <span class="info-value">${insumo.stockOptimo} ${insumo.unidad}</span>
                        </div>
                    </div>
                    
                    <div class="stock-progress-container">
                        <div class="stock-progress-bar">
                            <div class="stock-progress" style="width: ${Math.min(100, (insumo.stockActual / insumo.stockOptimo) * 100)}%"></div>
                        </div>
                        <div class="stock-limits">
                            <span class="stock-min" style="left: ${(insumo.stockMinimo / insumo.stockOptimo) * 100}%"></span>
                        </div>
                    </div>
                </div>
                
                ${insumo.descripcion ? `
                <div class="info-section">
                    <h3>Descripción</h3>
                    <p class="insumo-descripcion">${insumo.descripcion}</p>
                </div>
                ` : ''}
                
                <div class="info-section">
                    <h3>Datos adicionales</h3>
                    <div class="info-grid">
                        <div class="info-item">
                            <span class="info-label">Fecha de creación</span>
                            <span class="info-value">${fechaCreacion}</span>
                        </div>
                        <div class="info-item">
                            <span class="info-label">Última actualización</span>
                            <span class="info-value">${fechaActualizacion}</span>
                        </div>
                    </div>
                </div>
                
                ${movimientosHTML}
            </div>
            
            <div class="insumo-detalle-actions">
                <button class="btn-primary" id="registrar-movimiento-btn">
                    <i class="mdi mdi-swap-horizontal"></i>
                    Registrar movimiento
                </button>
                <button class="btn-secondary" id="editar-insumo-btn">
                    <i class="mdi mdi-pencil-outline"></i>
                    Editar insumo
                </button>
            </div>
        </div>
    `;
    
    // Abrir modal
    const modal = openModal(content, {
        title: 'Detalles del insumo',
        size: 'large'
    });
    
    // Configurar eventos
    const registrarMovimientoBtn = modal.querySelector('#registrar-movimiento-btn');
    if (registrarMovimientoBtn) {
        registrarMovimientoBtn.addEventListener('click', () => {
            closeModal(modal);
            registrarMovimiento(insumo.id);
        });
    }
    
    const editarInsumoBtn = modal.querySelector('#editar-insumo-btn');
    if (editarInsumoBtn) {
        editarInsumoBtn.addEventListener('click', () => {
            closeModal(modal);
            editarInsumo(insumo.id);
        });
    }
}

// Editar insumo
function editarInsumo(insumoId) {
    toggleLoader(true, 'Cargando datos...');
    
    // Obtener categorías para el formulario
    db.collection('categorias')
        .where('tipo', '==', 'insumo')
        .orderBy('nombre')
        .get()
        .then(categoriasSnapshot => {
            const categorias = [];
            categoriasSnapshot.forEach(doc => {
                categorias.push({
                    id: doc.id,
                    nombre: doc.data().nombre
                });
            });
            
            // Obtener datos del insumo
            db.collection('insumos').doc(insumoId).get()
                .then(doc => {
                    if (!doc.exists) {
                        showNotification('Error', 'No se encontró el insumo', 'error');
                        toggleLoader(false);
                        return;
                    }
                    
                    const insumo = {
                        id: doc.id,
                        ...doc.data()
                    };
                    
                    // Obtener proveedores para el formulario
                    db.collection('proveedores')
                        .orderBy('nombre')
                        .get()
                        .then(proveedoresSnapshot => {
                            const proveedores = [];
                            proveedoresSnapshot.forEach(doc => {
                                proveedores.push({
                                    id: doc.id,
                                    nombre: doc.data().nombre
                                });
                            });
                            
                            // Mostrar formulario
                            mostrarFormularioInsumo(insumo, categorias, proveedores);
                            toggleLoader(false);
                        })
                        .catch(error => {
                            console.error("Error al cargar proveedores:", error);
                            mostrarFormularioInsumo(insumo, categorias, []);
                            toggleLoader(false);
                        });
                })
                .catch(error => {
                    console.error("Error al cargar insumo:", error);
                    showNotification('Error', 'No se pudo cargar el insumo', 'error');
                    toggleLoader(false);
                });
        })
        .catch(error => {
            console.error("Error al cargar categorías:", error);
            showNotification('Error', 'No se pudieron cargar las categorías', 'error');
            toggleLoader(false);
        });
}

// Mostrar formulario de edición de insumo
function mostrarFormularioInsumo(insumo, categorias, proveedores) {
    // Opciones para categorías
    let categoriasOptions = '';
    categorias.forEach(cat => {
        const selected = cat.nombre === insumo.categoria ? 'selected' : '';
        categoriasOptions += `<option value="${cat.nombre}" ${selected}>${cat.nombre}</option>`;
    });
    
    // Opciones para proveedores
    let proveedoresOptions = '<option value="">Seleccionar proveedor</option>';
    proveedores.forEach(prov => {
        const selected = prov.nombre === insumo.proveedor ? 'selected' : '';
        proveedoresOptions += `<option value="${prov.nombre}" ${selected}>${prov.nombre}</option>`;
    });
    
    // Crear contenido del formulario
    const content = `
        <form id="insumo-form" class="form-grid">
            <div class="form-group span-2">
                <label for="nombre">Nombre</label>
                <input type="text" id="nombre" name="nombre" value="${insumo.nombre || ''}" required>
            </div>
            
            <div class="form-group">
                <label for="codigo">Código</label>
                <input type="text" id="codigo" name="codigo" value="${insumo.codigo || ''}" required>
            </div>
            
            <div class="form-group">
                <label for="categoria">Categoría</label>
                <select id="categoria" name="categoria" required>
                    ${categoriasOptions}
                </select>
            </div>
            
            <div class="form-group">
                <label for="unidad">Unidad de medida</label>
                <input type="text" id="unidad" name="unidad" value="${insumo.unidad || ''}" required>
            </div>
            
            <div class="form-group">
                <label for="ubicacion">Ubicación</label>
                <input type="text" id="ubicacion" name="ubicacion" value="${insumo.ubicacion || ''}">
            </div>
            
            <div class="form-group">
                <label for="stockActual">Stock actual</label>
                <input type="number" id="stockActual" name="stockActual" value="${insumo.stockActual || 0}" min="0" step="0.01" required>
            </div>
            
            <div class="form-group">
                <label for="stockMinimo">Stock mínimo</label>
                <input type="number" id="stockMinimo" name="stockMinimo" value="${insumo.stockMinimo || 0}" min="0" step="0.01" required>
            </div>
            
            <div class="form-group">
                <label for="stockOptimo">Stock óptimo</label>
                <input type="number" id="stockOptimo" name="stockOptimo" value="${insumo.stockOptimo || 0}" min="0" step="0.01" required>
            </div>
            
            <div class="form-group span-2">
                <label for="proveedor">Proveedor</label>
                <select id="proveedor" name="proveedor">
                    ${proveedoresOptions}
                </select>
            </div>
            
            <div class="form-group span-2">
                <label for="descripcion">Descripción</label>
                <textarea id="descripcion" name="descripcion" rows="3">${insumo.descripcion || ''}</textarea>
            </div>
        </form>
    `;
    
    // Abrir modal
    const modal = openModal(content, {
        title: insumo.id ? 'Editar insumo' : 'Nuevo insumo',
        size: 'medium',
        onClose: null
    });
    
    // Agregar botones de acción
    const modalFooter = document.createElement('div');
    modalFooter.className = 'modal-footer';
    modalFooter.innerHTML = `
        <button class="btn-secondary" id="cancel-btn">Cancelar</button>
        <button class="btn-primary" id="save-btn">Guardar</button>
    `;
    
    modal.querySelector('.modal-container').appendChild(modalFooter);
    
    // Configurar eventos
    const cancelBtn = modal.querySelector('#cancel-btn');
    const saveBtn = modal.querySelector('#save-btn');
    const form = modal.querySelector('#insumo-form');
    
    cancelBtn.addEventListener('click', () => {
        closeModal(modal);
    });
    
    saveBtn.addEventListener('click', () => {
        guardarInsumo(form, insumo.id, modal);
    });
    
    // Validación del formulario
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        guardarInsumo(form, insumo.id, modal);
    });
}

// Guardar insumo
function guardarInsumo(form, insumoId, modal) {
    // Validar formulario
    const validation = validateForm('insumo-form', {
        nombre: { required: true },
        codigo: { required: true },
        categoria: { required: true },
        unidad: { required: true },
        stockActual: { required: true, number: true, min: 0 },
        stockMinimo: { required: true, number: true, min: 0 },
        stockOptimo: { required: true, number: true, min: 0 }
    });
    
    if (!validation.isValid) {
        return;
    }
    
    // Obtener datos del formulario
    const formData = {
        nombre: form.nombre.value.trim(),
        codigo: form.codigo.value.trim(),
        categoria: form.categoria.value,
        unidad: form.unidad.value.trim(),
        ubicacion: form.ubicacion.value.trim(),
        stockActual: parseFloat(form.stockActual.value),
        stockMinimo: parseFloat(form.stockMinimo.value),
        stockOptimo: parseFloat(form.stockOptimo.value),
        proveedor: form.proveedor.value.trim(),
        descripcion: form.descripcion.value.trim(),
        fechaActualizacion: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    toggleLoader(true, insumoId ? 'Actualizando insumo...' : 'Creando insumo...');
    
    if (insumoId) {
        // Actualizar insumo existente
        db.collection('insumos').doc(insumoId).update(formData)
            .then(() => {
                toggleLoader(false);
                closeModal(modal);
                showNotification('Éxito', 'Insumo actualizado correctamente', 'success');
                
                // Recargar datos
                const insumosContainer = document.getElementById('insumos-container');
                if (insumosContainer) {
                    loadInsumos(insumosContainer);
                }
            })
            .catch(error => {
                console.error("Error al actualizar insumo:", error);
                toggleLoader(false);
                showNotification('Error', 'No se pudo actualizar el insumo', 'error');
            });
    } else {
        // Crear nuevo insumo
        formData.fechaCreacion = firebase.firestore.FieldValue.serverTimestamp();
        
        db.collection('insumos').add(formData)
            .then(() => {
                toggleLoader(false);
                closeModal(modal);
                showNotification('Éxito', 'Insumo creado correctamente', 'success');
                
                // Recargar datos
                const insumosContainer = document.getElementById('insumos-container');
                if (insumosContainer) {
                    loadInsumos(insumosContainer);
                }
            })
            .catch(error => {
                console.error("Error al crear insumo:", error);
                toggleLoader(false);
                showNotification('Error', 'No se pudo crear el insumo', 'error');
            });
    }
}

// Registrar movimiento de insumo
function registrarMovimiento(insumoId) {
    toggleLoader(true, 'Cargando datos...');
    
    db.collection('insumos').doc(insumoId).get()
        .then(doc => {
            if (!doc.exists) {
                showNotification('Error', 'No se encontró el insumo', 'error');
                toggleLoader(false);
                return;
            }
            
            const insumo = {
                id: doc.id,
                ...doc.data()
            };
            
            // Mostrar formulario de movimiento
            mostrarFormularioMovimiento(insumo);
            toggleLoader(false);
        })
        .catch(error => {
            console.error("Error al cargar insumo:", error);
            showNotification('Error', 'No se pudo cargar el insumo', 'error');
            toggleLoader(false);
        });
}

// Mostrar formulario de movimiento
function mostrarFormularioMovimiento(insumo) {
    const content = `
        <form id="movimiento-form" class="form-grid">
            <div class="form-group span-2">
                <label>Insumo</label>
                <div class="input-readonly">
                    <span>${insumo.nombre}</span>
                    <small>${insumo.codigo}</small>
                </div>
            </div>
            
            <div class="form-group span-2">
                <label>Stock actual</label>
                <div class="input-readonly">
                    <span>${insumo.stockActual} ${insumo.unidad}</span>
                </div>
            </div>
            
            <div class="form-group span-2">
                <label for="tipo">Tipo de movimiento</label>
                <div class="radio-group">
                    <label class="radio-container">
                        <input type="radio" name="tipo" value="entrada" checked>
                        <span class="radio-label">Entrada</span>
                    </label>
                    <label class="radio-container">
                        <input type="radio" name="tipo" value="salida">
                        <span class="radio-label">Salida</span>
                    </label>
                </div>
            </div>
            
            <div class="form-group span-2">
                <label for="cantidad">Cantidad</label>
                <div class="input-group">
                    <input type="number" id="cantidad" name="cantidad" min="0.01" step="0.01" required>
                    <span class="input-addon">${insumo.unidad}</span>
                </div>
            </div>
            
            <div class="form-group span-2">
                <label for="motivo">Motivo</label>
                <select id="motivo" name="motivo" required>
                    <option value="">Seleccionar motivo</option>
                    <option value="Compra">Compra</option>
                    <option value="Donación">Donación</option>
                    <option value="Devolución">Devolución</option>
                    <option value="Uso en laboratorio">Uso en laboratorio</option>
                    <option value="Préstamo">Préstamo</option>
                    <option value="Vencimiento">Vencimiento</option>
                    <option value="Daño">Daño</option>
                    <option value="Ajuste de inventario">Ajuste de inventario</option>
                    <option value="Otro">Otro</option>
                </select>
            </div>
            
            <div class="form-group span-2" id="otro-motivo-container" style="display: none;">
                <label for="otroMotivo">Especificar motivo</label>
                <input type="text" id="otroMotivo" name="otroMotivo">
            </div>
            
            <div class="form-group span-2">
                <label for="observaciones">Observaciones</label>
                <textarea id="observaciones" name="observaciones" rows="3"></textarea>
            </div>
        </form>
    `;
    
    // Abrir modal
    const modal = openModal(content, {
        title: 'Registrar movimiento',
        size: 'medium',
        onClose: null
    });
    
    // Agregar botones de acción
    const modalFooter = document.createElement('div');
    modalFooter.className = 'modal-footer';
    modalFooter.innerHTML = `
        <button class="btn-secondary" id="cancel-btn">Cancelar</button>
        <button class="btn-primary" id="save-btn">Registrar</button>
    `;
    
    modal.querySelector('.modal-container').appendChild(modalFooter);
    
    // Configurar eventos
    const cancelBtn = modal.querySelector('#cancel-btn');
    const saveBtn = modal.querySelector('#save-btn');
    const form = modal.querySelector('#movimiento-form');
    const motivoSelect = modal.querySelector('#motivo');
    const otroMotivoContainer = modal.querySelector('#otro-motivo-container');
    
    // Mostrar/ocultar campo "otro motivo"
    motivoSelect.addEventListener('change', () => {
        otroMotivoContainer.style.display = motivoSelect.value === 'Otro' ? 'block' : 'none';
    });
    
    cancelBtn.addEventListener('click', () => {
        closeModal(modal);
    });
    
    saveBtn.addEventListener('click', () => {
        guardarMovimiento(form, insumo, modal);
    });
    
    // Validación del formulario
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        guardarMovimiento(form, insumo, modal);
    });
}

// Guardar movimiento
function guardarMovimiento(form, insumo, modal) {
    // Validar formulario
    const validation = validateForm('movimiento-form', {
        cantidad: { 
            required: true, 
            number: true, 
            min: 0.01,
            validate: (value) => {
                const cantidad = parseFloat(value);
                const tipo = form.querySelector('input[name="tipo"]:checked').value;
                
                if (tipo === 'salida' && cantidad > insumo.stockActual) {
                    return `No puede retirar más de ${insumo.stockActual} ${insumo.unidad}`;
                }
                
                return null;
            }
        },
        motivo: { required: true },
        otroMotivo: { 
            validate: (value, form) => {
                const motivo = form.motivo.value;
                if (motivo === 'Otro' && !value.trim()) {
                    return 'Debe especificar el motivo';
                }
                return null;
            }
        }
    });
    
    if (!validation.isValid) {
        return;
    }
    
    // Obtener datos del formulario
    const tipo = form.querySelector('input[name="tipo"]:checked').value;
    const cantidad = parseFloat(form.cantidad.value);
    let motivo = form.motivo.value;
    
    if (motivo === 'Otro') {
        motivo = form.otroMotivo.value.trim();
    }
    
    // Calcular nuevo stock
    const nuevoStock = tipo === 'entrada' 
        ? insumo.stockActual + cantidad 
        : insumo.stockActual - cantidad;
    
    // Datos del movimiento
    const movimientoData = {
        insumoId: insumo.id,
        insumoNombre: insumo.nombre,
        insumoCodigo: insumo.codigo,
        tipo: tipo,
        cantidad: cantidad,
        stockAnterior: insumo.stockActual,
        stockNuevo: nuevoStock,
        motivo: motivo,
        observaciones: form.observaciones.value.trim(),
        fecha: firebase.firestore.FieldValue.serverTimestamp(),
        usuarioId: currentUser.uid,
        usuarioNombre: currentUser.displayName || 'Usuario'
    };
    
    toggleLoader(true, 'Registrando movimiento...');
    
    // Usar una transacción para garantizar consistencia
    db.runTransaction(transaction => {
        const insumoRef = db.collection('insumos').doc(insumo.id);
        
        return transaction.get(insumoRef).then(doc => {
            if (!doc.exists) {
                throw new Error('El insumo no existe');
            }
            
            // Verificar stock actual (podría haber cambiado desde que se cargó el formulario)
            const stockActual = doc.data().stockActual;
            
            if (tipo === 'salida' && cantidad > stockActual) {
                throw new Error(`No puede retirar más de ${stockActual} ${insumo.unidad}`);
            }
            
            // Actualizar stock
            const nuevoStockActual = tipo === 'entrada' 
                ? stockActual + cantidad 
                : stockActual - cantidad;
            
            // Actualizar el movimiento con los datos actualizados
            movimientoData.stockAnterior = stockActual;
            movimientoData.stockNuevo = nuevoStockActual;
            
            // Actualizar insumo
            transaction.update(insumoRef, { 
                stockActual: nuevoStockActual,
                fechaActualizacion: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            // Crear movimiento
            const movimientoRef = db.collection('movimientos').doc();
            transaction.set(movimientoRef, movimientoData);
        });
    })
    .then(() => {
        toggleLoader(false);
        closeModal(modal);
        showNotification('Éxito', 'Movimiento registrado correctamente', 'success');
        
        // Recargar datos
        const insumosContainer = document.getElementById('insumos-container');
        if (insumosContainer) {
            loadInsumos(insumosContainer);
        }
    })
    .catch(error => {
        console.error("Error al registrar movimiento:", error);
        toggleLoader(false);
        showNotification('Error', error.message || 'No se pudo registrar el movimiento', 'error');
    });
}