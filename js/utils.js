// Funciones de utilidad

// Mostrar notificación
function showNotification(title, message, type = 'info') {
    const notification = document.getElementById('app-notification');
    const notificationTitle = document.getElementById('notification-title');
    const notificationMessage = document.getElementById('notification-message');
    const notificationIcon = document.getElementById('notification-icon');
    
    if (!notification || !notificationTitle || !notificationMessage || !notificationIcon) {
        console.error("Elementos de notificación no encontrados");
        alert(`${title}: ${message}`);
        return;
    }
    
    notificationTitle.textContent = title;
    notificationMessage.textContent = message;
    
    // Eliminar clases anteriores
    notification.className = '';
    notification.classList.add('show');
    
    if (type) notification.classList.add(type);
    
    if (type === 'success') notificationIcon.className = 'mdi mdi-check-circle';
    else if (type === 'error') notificationIcon.className = 'mdi mdi-alert-circle';
    else notificationIcon.className = 'mdi mdi-information';
    
    setTimeout(() => {
        notification.className = '';
    }, 3000);
}

// Mostrar/ocultar loader
function toggleLoader(show, message = 'Cargando...') {
    const loader = document.getElementById('app-loader');
    const loaderMessage = loader ? loader.querySelector('.loader-message') : null;
    
    if (!loader) {
        console.error("Elemento loader no encontrado");
        return;
    }
    
    if (show) {
        if (loaderMessage) loaderMessage.textContent = message;
        loader.classList.add('active');
    } else {
        loader.classList.remove('active');
    }
}

// Mostrar confirmación
function showConfirm(message) {
    return new Promise((resolve) => {
        const confirmModal = document.getElementById('confirmModal');
        const confirmMessage = document.getElementById('confirmModalMessage');
        const confirmOkBtn = document.getElementById('confirmOkBtn');
        const confirmCancelBtn = document.getElementById('confirmCancelBtn');
        
        if (!confirmModal || !confirmMessage || !confirmOkBtn || !confirmCancelBtn) {
            console.error("Elementos de confirmación no encontrados");
            const userConfirmed = confirm(message);
            resolve(userConfirmed);
            return;
        }
        
        confirmMessage.textContent = message;
        confirmModal.classList.add('active');
        
        const onOk = () => { cleanup(); resolve(true); };
        const onCancel = () => { cleanup(); resolve(false); };
        
        const cleanup = () => {
            confirmOkBtn.removeEventListener('click', onOk);
            confirmCancelBtn.removeEventListener('click', onCancel);
            confirmModal.classList.remove('active');
        };
        
        confirmOkBtn.addEventListener('click', onOk, { once: true });
        confirmCancelBtn.addEventListener('click', onCancel, { once: true });
    });
}