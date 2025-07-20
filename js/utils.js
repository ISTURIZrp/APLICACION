// Funciones de utilidad

// Formatear fecha
function formatDate(date, format = 'dd/MM/yyyy') {
    if (!date) return '';
    
    if (typeof date === 'string') date = new Date(date);
    if (date instanceof firebase.firestore.Timestamp) date = date.toDate();
    
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    return format.replace('dd', day).replace('MM', month).replace('yyyy', year);
}

// Mostrar notificación
function showNotification(title, message, type = 'info') {
    const notification = document.getElementById('app-notification');
    const notificationTitle = document.getElementById('notification-title');
    const notificationMessage = document.getElementById('notification-message');
    const notificationIcon = document.getElementById('notification-icon');
    
    notificationTitle.textContent = title;
    notificationMessage.textContent = message;
    notification.className = 'show ' + type;
    
    if (type === 'success') notificationIcon.textContent = 'check_circle';
    else if (type === 'error') notificationIcon.textContent = 'error';
    else notificationIcon.textContent = 'info';
    
    setTimeout(() => notification.className = '', 3000);
}

// Mostrar confirmación
function showConfirm(message) {
    return new Promise((resolve) => {
        const confirmModal = document.getElementById('confirmModal');
        const confirmMessage = document.getElementById('confirmModalMessage');
        const confirmOkBtn = document.getElementById('confirmOkBtn');
        const confirmCancelBtn = document.getElementById('confirmCancelBtn');
        
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

// Mostrar/ocultar loader
function toggleLoader(show, message = 'Cargando...') {
    const loader = document.getElementById('app-loader');
    const loaderMessage = loader ? loader.querySelector('.loader-message') : null;
    
    if (!loader) return;
    
    if (show) {
        if (loaderMessage) loaderMessage.textContent = message;
        loader.classList.add('active');
    } else {
        loader.classList.remove('active');
    }
}