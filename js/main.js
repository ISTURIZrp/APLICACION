// Variables globales
let currentUser = null;
let isMobileView = window.innerWidth <= 768;

// Punto de entrada
document.addEventListener('DOMContentLoaded', () => {
    // Inicializar autenticación
    initAuth();
    
    // Detectar tipo de vista
    handleWindowResize();
    
    // Escuchar cambios de tamaño de ventana
    window.addEventListener('resize', handleWindowResize);
});

// Manejar cambio de tamaño de ventana
function handleWindowResize() {
    isMobileView = window.innerWidth <= 768;
    
    // Ajustar interfaz según tipo de vista
    if (document.getElementById('sidebar')) {
        if (isMobileView) {
            document.getElementById('sidebar').classList.add('mobile-view');
            document.getElementById('content').classList.add('mobile-view');
        } else {
            document.getElementById('sidebar').classList.remove('mobile-view');
            document.getElementById('content').classList.remove('mobile-view');
        }
    }
}

// Inicializar interfaz para usuario autenticado
function initUserInterface() {
    // Cargar sidebar
    loadSidebar();
    
    // Inicializar página actual
    initCurrentPage();
    
    toggleLoader(false);
}

// Cargar sidebar
function loadSidebar() {
    const sidebarContainer = document.getElementById('sidebar-container');
    if (!sidebarContainer) return;
    
    fetch('sidebar.html')
        .then(response => response.text())
        .then(html => {
            sidebarContainer.innerHTML = html;
            
            // Configurar eventos del sidebar
            document.getElementById('user-logout-btn')?.addEventListener('click', logout);
            
            // Marcar página actual en el menú
            highlightCurrentPage();
        })
        .catch(error => {
            console.error("Error cargando sidebar:", error);
            sidebarContainer.innerHTML = "<p>Error al cargar el menú</p>";
        });
}

// Resaltar página actual en el menú
function highlightCurrentPage() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    
    document.querySelectorAll('#sidebar a').forEach(link => {
        if (link.getAttribute('href') === currentPage) {
            link.classList.add('active');
            
            // Si está en un submenú, expandirlo
            const submenu = link.closest('.submenu');
            if (submenu) {
                submenu.style.display = 'block';
                
                const header = submenu.previousElementSibling;
                if (header) {
                    const arrow = header.querySelector('.dropdown-arrow');
                    if (arrow) arrow.style.transform = 'rotate(180deg)';
                }
            }
        }
    });
}

// Inicializar página actual
function initCurrentPage() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    
    // Inicializar según la página
    if (currentPage === 'insumos.html') {
        const container = document.getElementById('insumos-container');
        if (container) loadInsumosYLotes(container);
    } 
    else if (currentPage === 'movimientos.html') {
        const container = document.getElementById('movimientos-container');
        if (container) loadMovimientos(container);
    }
    else if (currentPage === 'usuarios.html') {
        const container = document.getElementById('usuarios-container');
        if (container) loadUsuarios(container);
    }
    else if (currentPage === 'reportes.html') {
        const container = document.getElementById('reportes-container');
        if (container) loadReportes(container);
    }
    else if (currentPage === 'dashboard.html') {
        initDashboard();
    }
}

// Cargar datos del usuario
function loadUserData(userId) {
    db.collection('usuarios').doc(userId).get()
        .then(doc => {
            if (doc.exists) {
                const userData = doc.data();
                
                // Actualizar UI con datos del usuario
                document.querySelectorAll('.user-name').forEach(el => {
                    el.textContent = userData.nombre || 'Usuario';
                });
                
                document.querySelectorAll('.user-role').forEach(el => {
                    el.textContent = userData.role || 'Usuario';
                });
                
                // Actualizar última conexión
                db.collection('usuarios').doc(userId).update({
                    lastLogin: firebase.firestore.FieldValue.serverTimestamp()
                }).catch(console.error);
            } else {
                // Crear perfil básico si no existe
                createBasicUserProfile(userId);
            }
        })
        .catch(error => {
            console.error("Error cargando datos del usuario:", error);
        });
}