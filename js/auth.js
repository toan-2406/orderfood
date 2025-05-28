import { CONFIG } from './constants.js';

// Application-level user authentication state
export let appUser = {
    isAuthenticated: false,
    id: null, 
    username: null,
    fullName: null, 
    role: null, 
    token: null 
};

// Initialize auth system
export function initializeAuth() {
    loadAuthFromLocalStorage();
    updateAuthStatusUI();
}

// --- LocalStorage Auth Functions ---
export function saveAuthToLocalStorage(userData) {
    try {
        localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(userData));
    } catch (e) {
        console.error("Error saving auth to localStorage:", e);
    }
}

export function loadAuthFromLocalStorage() {
    try {
        const storedUser = localStorage.getItem(CONFIG.STORAGE_KEY);
        if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            if (parsedUser && typeof parsedUser.isAuthenticated === 'boolean') {
                Object.assign(appUser, parsedUser);
                console.log("Loaded user from localStorage:", appUser);
            }
        }
    } catch (e) {
        console.error("Error loading auth from localStorage:", e);
        localStorage.removeItem(CONFIG.STORAGE_KEY); 
    }
}

export function clearAuthFromLocalStorage() {
    try {
        localStorage.removeItem(CONFIG.STORAGE_KEY);
    } catch (e) {
        console.error("Error clearing auth from localStorage:", e);
    }
}

export function logout() {
    const oldUsername = appUser.fullName || appUser.username;
    clearAuthFromLocalStorage();
    Object.assign(appUser, {
        isAuthenticated: false,
        id: null,
        username: null,
        fullName: null,
        role: null,
        token: null
    });
    return oldUsername;
}

export function updateAuthStatusUI() {
    const authStatusElement = document.getElementById('authStatus');
    if (appUser.isAuthenticated) {
        const displayName = appUser.fullName || appUser.username;
        authStatusElement.textContent = `Đã đăng nhập: ${displayName} (${appUser.role || 'user'})`;
        authStatusElement.classList.remove('text-red-400');
        authStatusElement.classList.add('text-green-400');
    } else {
        authStatusElement.textContent = 'Chưa đăng nhập';
        authStatusElement.classList.remove('text-green-400');
        authStatusElement.classList.add('text-red-400'); 
    }
} 