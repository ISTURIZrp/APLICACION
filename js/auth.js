// Verificar si el usuario ya está autenticado
auth.onAuthStateChanged(user => {
    // Determinar si estamos en la página de login
    const isLoginPage = window.location.pathname.includes('index.html') || window.location.pathname === '/' || window.location.pathname === '';
    
    if (isLoginPage) {
        if (user) {
            // Si el usuario ya está autenticado y estamos en la página de login, redirigir al dashboard
            window.location.href = 'home.html';
        }
    } else {
        if (!user) {
            // Si no hay usuario autenticado y no estamos en la página de login, redirigir al login
            window.location.href = 'index.html';
        }
    }
});

// Manejar el envío del formulario de inicio de sesión
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const rememberMe = document.getElementById('remember') ? document.getElementById('remember').checked : false;
            const errorElement = document.getElementById('login-error');
            
            // Limpiar cualquier mensaje de error anterior
            errorElement.textContent = '';
            
            // Establecer persistencia según "recordarme"
            const persistence = rememberMe ? firebase.auth.Auth.Persistence.LOCAL : firebase.auth.Auth.Persistence.SESSION;
            
            // Establecer persistencia y luego iniciar sesión
            auth.setPersistence(persistence)
                .then(() => {
                    // Iniciar sesión con Firebase
                    return auth.signInWithEmailAndPassword(email, password);
                })
                .then((userCredential) => {
                    // Registrar último acceso
                    db.collection('usuarios').doc(userCredential.user.uid).update({
                        lastLogin: firebase.firestore.FieldValue.serverTimestamp()
                    }).catch(error => {
                        console.error("Error al actualizar último acceso:", error);
                    });
                    
                    // Redirigir al dashboard después del inicio de sesión exitoso
                    window.location.href = 'home.html';
                })
                .catch(error => {
                    // Mostrar mensaje de error
                    switch(error.code) {
                        case 'auth/user-not-found':
                            errorElement.textContent = 'Usuario no encontrado. Verifica tu correo electrónico.';
                            break;
                        case 'auth/wrong-password':
                            errorElement.textContent = 'Contraseña incorrecta. Inténtalo de nuevo.';
                            break;
                        case 'auth/invalid-email':
                            errorElement.textContent = 'Formato de correo electrónico inválido.';
                            break;
                        case 'auth/user-disabled':
                            errorElement.textContent = 'Esta cuenta ha sido deshabilitada. Contacta al administrador.';
                            break;
                        case 'auth/too-many-requests':
                            errorElement.textContent = 'Demasiados intentos fallidos. Inténtalo más tarde.';
                            break;
                        default:
                            errorElement.textContent = error.message;
                    }
                });
        });
    }
    
    // Manejar el enlace "Olvidaste tu contraseña"
    const forgotPasswordLink = document.querySelector('.forgot-password');
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', (e) => {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const errorElement = document.getElementById('login-error');
            
            if (!email) {
                errorElement.textContent = 'Por favor, ingresa tu correo electrónico para restablecer la contraseña.';
                return;
            }
            
            // Enviar correo de restablecimiento
            auth.sendPasswordResetEmail(email)
                .then(() => {
                    errorElement.textContent = '';
                    alert('Se ha enviado un correo electrónico para restablecer tu contraseña. Revisa tu bandeja de entrada.');
                })
                .catch(error => {
                    switch(error.code) {
                        case 'auth/invalid-email':
                            errorElement.textContent = 'Formato de correo electrónico inválido.';
                            break;
                        case 'auth/user-not-found':
                            errorElement.textContent = 'No hay usuario registrado con este correo electrónico.';
                            break;
                        default:
                            errorElement.textContent = error.message;
                    }
                });
        });
    }
});