import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { auth, db } from './firebase-config.js';

const pageContainer = document.getElementById('page-container');
const loginSection = document.getElementById('login-section');
const userInfoBox = document.getElementById('user-info-box');
const userDropdown = document.getElementById('user-dropdown');
const userNameDisplay = document.getElementById('user-name-display');
const userRoleDisplay = document.getElementById('user-role-display');
const logoutBtn = document.getElementById('logout-btn');

onAuthStateChanged(auth, async (user) => {
    if (user) {
        // Usuario autenticado
        pageContainer.style.display = 'block';
        loginSection.style.display = 'none';

        try {
            const userDoc = await getDoc(doc(db, 'users', user.uid));
            if (userDoc.exists()) {
                const userData = userDoc.data();
                userNameDisplay.textContent = userData.displayName || user.email;
                userRoleDisplay.textContent = userData.role || 'Usuario';
            } else {
                userNameDisplay.textContent = user.email;
                userRoleDisplay.textContent = 'Usuario';
            }
        } catch (error) {
            console.error("Error al obtener datos del usuario:", error);
            userNameDisplay.textContent = user.email;
        }
    } else {
        // No autenticado
        pageContainer.style.display = 'none';
        loginSection.style.display = 'block';
    }
});

logoutBtn.addEventListener('click', () => signOut(auth));

userInfoBox.addEventListener('click', (e) => {
    e.stopPropagation();
    userDropdown.classList.toggle('show');
});

document.addEventListener('click', () => {
    userDropdown.classList.remove('show');
});

document.querySelectorAll('.module-header').forEach(header => {
    header.addEventListener('click', () => {
        header.closest('.module').classList.toggle('active');
    });
});
