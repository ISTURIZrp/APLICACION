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
            if (window.location.pathname.includes('index.html') || window.location.pathname.endsWith('/')) {
                // Si estamos en la página de login, redirigir al dashboard
                window.location.href = 'dashboard.html';
            } else {
                // Si estamos en otra página, inicializar la interfaz
                initUserInterface();
            }
        } else {
            // No hay usuario autenticado
            console.log("No hay usuario autenticado");
            
            // Redirigir al login si no estamos ya ahí
            if (!window.location.pathname.includes('index.html') && !window.location.pathname.endsWith('/')) {
                window.location.href = 'index.html';
            } else {
                // Si ya estamos en la página de login, ocultar el loader
                toggleLoader(false);
            }
        }
    });
}

// Iniciar sesión
async function login(email, password) {
    try {
        // Validar campos
        if (!email || !email.trim()) {
            showNotification('Error', 'Por favor ingrese su correo electrónico', 'error');
            return;
        }
        
        if (!password || !password.trim()) {
            showNotification('Error', 'Por favor ingrese su contraseña', 'error');
            return;
        }
        
        toggleLoader(true, 'Iniciando sesión...');
        
        // Intentar iniciar sesión
        await auth.signInWithEmailAndPassword(email, password);
        
        // La redirección se maneja en el listener onAuthStateChanged
    } catch (error) {
        console.error("Error de login:", error);
        let errorMessage = 'Error al iniciar sesión';
        
        // Mensajes más amigables
        if (error.code === 'auth/invalid-email') {
            errorMessage = 'El formato del correo electrónico no es válido';
        } else if (error.code === 'auth/user-disabled') {
            errorMessage = 'Esta cuenta ha sido deshabilitada';
        } else if (error.code === 'auth/user-not-found') {
            errorMessage = 'No existe una cuenta con este correo electrónico';
        } else if (error.code === 'auth/wrong-password') {
            errorMessage = 'Contraseña incorrecta';
        } else if (error.code === 'auth/too-many-requests') {
            errorMessage = 'Demasiados intentos fallidos. Intente más tarde';
        }
        
        showNotification('Error', errorMessage, 'error');
        toggleLoader(false);
    }
}

// Cerrar sesión
function logout() {
    showConfirm('¿Está seguro que desea cerrar sesión?').then(confirmed => {
        if (confirmed) {
            toggleLoader(true, 'Cerrando sesión...');
            
            auth.signOut()
                .then(() => {
                    window.location.href = 'index.html';
                })
                .catch(error => {
                    console.error("Error al cerrar sesión:", error);
                    showNotification('Error', 'No se pudo cerrar sesión', 'error');
                    toggleLoader(false);
                });
        }
    });
}

// Cargar datos del usuario desde Firestore
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
                }).catch(error => {
                    console.error("Error actualizando última conexión:", error);
                });
            } else {
                // Crear perfil básico si no existe
                createBasicUserProfile(userId);
            }
        })
        .catch(error => {
            console.error("Error cargando datos del usuario:", error);
        });
}

// Crear perfil básico de usuario
function createBasicUserProfile(userId) {
    const user = auth.currentUser;
    if (!user) return;
    
    const userData = {
        nombre: user.displayName || user.email.split('@')[0] || 'Usuario',
        email: user.email,
        role: 'viewer', // Rol por defecto
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        lastLogin: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    db.collection('usuarios').doc(userId).set(userData)
        .then(() => {
            console.log("Perfil de usuario creado");
            showNotification('Bienvenido', 'Se ha creado tu perfil de usuario', 'success');
        })
        .catch(error => {
            console.error("Error creando perfil:", error);
        });
} 