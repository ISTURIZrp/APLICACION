// Funciones de autenticación

// Verificar autenticación
function initAuth() {
    toggleLoader(true, 'Verificando sesión...');
    
    auth.onAuthStateChanged(user => {
        if (user) {
            // Usuario autenticado
            console.log("Usuario autenticado:", user.uid);
            currentUser = user;
            
            // Cargar datos del usuario
            loadUserData(user.uid);
            
            // Inicializar interfaz para usuario autenticado
            initUserInterface();
        } else {
            // No hay usuario autenticado
            console.log("No hay usuario autenticado");
            
            // Redirigir al login si no estamos ya ahí
            if (!window.location.pathname.includes('index.html') && !window.location.pathname.endsWith('/')) {
                window.location.href = 'index.html';
            }
            
            toggleLoader(false);
        }
    });
}

// Iniciar sesión
async function login(email, password) {
    try {
        toggleLoader(true, 'Iniciando sesión...');
        await auth.signInWithEmailAndPassword(email, password);
        // La redirección se maneja en el listener onAuthStateChanged
    } catch (error) {
        console.error("Error de login:", error);
        let errorMessage = 'Error al iniciar sesión';
        
        // Mensajes más amigables
        if (error.code === 'auth/invalid-email') errorMessage = 'Email inválido';
        else if (error.code === 'auth/user-disabled') errorMessage = 'Cuenta deshabilitada';
        else if (error.code === 'auth/user-not-found') errorMessage = 'Usuario no encontrado';
        else if (error.code === 'auth/wrong-password') errorMessage = 'Contraseña incorrecta';
        
        showNotification('Error', errorMessage, 'error');
        toggleLoader(false);
    }
}

// Cerrar sesión
function logout() {
    showConfirm('¿Está seguro que desea cerrar sesión?').then(confirmed => {
        if (confirmed) {
            auth.signOut()
                .then(() => window.location.href = 'index.html')
                .catch(error => {
                    console.error("Error al cerrar sesión:", error);
                    showNotification('Error', 'No se pudo cerrar sesión', 'error');
                });
        }
    });
}