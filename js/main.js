// Variables globales
let isMobileView = window.innerWidth <= 768;

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
        
        // Inicializar eventos específicos para dispositivos móviles
        initMobileEvents();
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
    
    // Colapsar/expandir sidebar (sólo en desktop)
    const collapseSidebar = document.getElementById('collapse-sidebar');
    if (collapseSidebar) {
        collapseSidebar.addEventListener('click', () => {
            if (!isMobileView) {
                // En desktop, colapsar/expandir el sidebar
                const sidebar = document.getElementById('sidebar');
                sidebar.classList.toggle('collapsed');
            } else {
                // En móvil, mostrar/ocultar el sidebar
                toggleMobileSidebar();
            }
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
                showNotification('Error', 'No se pudo cerrar sesión: ' + error.message, 'error');
            });
        });
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

// Inicializar al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    // Inicializar tema
    initTheme();
    
    // Registrar Service Worker
    registerServiceWorker();
    
    // Comprobar si es vista móvil
    isMobileView = window.innerWidth <= 768;
});