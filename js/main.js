// Referencias a elementos DOM
const pageContainer = document.getElementById('page-container');
const userInfoBox = document.getElementById('user-info-box');
const userDropdown = document.getElementById('user-dropdown');
const userNameDisplay = document.getElementById('user-name-display');
const userRoleDisplay = document.getElementById('user-role-display');
const logoutBtn = document.getElementById('logout-btn');
const notificationDiv = document.getElementById('app-notification');
const notificationTitle = document.getElementById('notification-title');
const notificationMessage = document.getElementById('notification-message');
const loginForm = document.getElementById('login-form');
const loginEmail = document.getElementById('login-email');
const loginPassword = document.getElementById('login-password');
const loginSection = document.getElementById('login-section');

// Estado inicial
pageContainer.style.display = 'none';
loginSection.style.display = 'block';

// Mostrar notificación
function showNotification(title, message, type = 'info') {
    notificationTitle.textContent = title;
    notificationMessage.textContent = message;
    notificationDiv.className = 'show ' + type;
    setTimeout(() => { 
        notificationDiv.className = 'show ' + type;
        setTimeout(() => notificationDiv.className = '', 3000); 
    }, 100);
}

// Manejar estado de autenticación
auth.onAuthStateChanged(async (user) => {
    if (user) {
        // Usuario autenticado
        try {
            // Obtener datos adicionales del usuario desde Firestore
            const userDoc = await db.collection('users').doc(user.uid).get();
            
            if (userDoc.exists) {
                const userData = userDoc.data();
                
                // Actualizar UI con datos del usuario
                userNameDisplay.textContent = userData.displayName || user.email;
                userRoleDisplay.textContent = userData.role || 'Usuario';
                
                // Mostrar panel de control
                pageContainer.style.display = 'flex';
                loginSection.style.display = 'none';
                
                showNotification('Bienvenido', `Hola ${userData.displayName || user.email}`, 'success');
            } else {
                // Si no hay datos adicionales, usar solo el email
                userNameDisplay.textContent = user.email;
                userRoleDisplay.textContent = 'Usuario';
                
                // Mostrar panel de control
                pageContainer.style.display = 'flex';
                loginSection.style.display = 'none';
                
                showNotification('Bienvenido', `Hola ${user.email}`, 'success');
            }
        } catch (error) {
            console.error("Error al obtener datos del usuario:", error);
            showNotification('Error', 'No se pudieron cargar los datos del usuario', 'error');
        }
    } else {
        // No autenticado
        userNameDisplay.textContent = 'Iniciar sesión';
        userRoleDisplay.textContent = 'No autenticado';
        pageContainer.style.display = 'none';
        loginSection.style.display = 'block';
    }
});

// Manejar inicio de sesión
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = loginEmail.value;
    const password = loginPassword.value;
    
    try {
        const userCredential = await auth.signInWithEmailAndPassword(email, password);
        showNotification('Éxito', 'Inicio de sesión correcto', 'success');
    } catch (error) {
        let errorMessage = 'Error al iniciar sesión';
        
        switch(error.code) {
            case 'auth/user-not-found':
                errorMessage = 'Usuario no registrado';
                break;
            case 'auth/wrong-password':
                errorMessage = 'Contraseña incorrecta';
                break;
            case 'auth/invalid-email':
                errorMessage = 'Email no válido';
                break;
            default:
                errorMessage = error.message;
        }
        
        showNotification('Error', errorMessage, 'error');
    }
});

// Manejar cierre de sesión
logoutBtn.addEventListener('click', (e) => {
    e.preventDefault();
    auth.signOut().then(() => {
        showNotification('Sesión cerrada', 'Has cerrado sesión correctamente', 'info');
    }).catch((error) => {
        showNotification('Error', 'No se pudo cerrar la sesión', 'error');
    });
});

// Toggle dropdown de usuario
userInfoBox.addEventListener('click', (e) => {
    e.stopPropagation();
    userDropdown.classList.toggle('show');
});

// Cerrar dropdown al hacer clic fuera
document.addEventListener('click', (e) => {
    if (!userInfoBox.contains(e.target)) {
        userDropdown.classList.remove('show');
    }
});

// Mostrar/ocultar contenido de los módulos
const modules = document.querySelectorAll('.module');

modules.forEach(module => {
    const header = module.querySelector('.module-header');
    
    header.addEventListener('click', () => {
        // Cerrar todos los módulos
        modules.forEach(m => {
            if (m !== module) m.classList.remove('active');
        });
        
        // Alternar el módulo actual
        module.classList.toggle('active');
    });
});

// Inicializar módulo de insumos abierto
document.getElementById('insumos-module').classList.add('active');
