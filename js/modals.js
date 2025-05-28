import { CONFIG } from './constants.js';
import { appUser, saveAuthToLocalStorage, updateAuthStatusUI } from './auth.js';
import { addMessage, openModal, closeModal, setupModalSubmitOnEnter } from './ui-utils.js';

// DOM Elements for modals
let modalElements = {};

export function initializeModalElements() {
    // Insert Modal Elements
    modalElements.insertModal = document.getElementById('insertModal');
    modalElements.insertTextarea = document.getElementById('insertTextarea');
    modalElements.confirmInsertButton = document.getElementById('confirmInsertButton');
    modalElements.cancelInsertButton = document.getElementById('cancelInsertButton');
    modalElements.insertButtonText = document.getElementById('insertButtonText');
    modalElements.insertLoadingSpinner = document.getElementById('insertLoadingSpinner');

    // Auth Modal Elements
    modalElements.authModal = document.getElementById('authModal');
    modalElements.authUsernameInput = document.getElementById('authUsername');
    modalElements.authPasswordInput = document.getElementById('authPassword');
    modalElements.confirmAuthButton = document.getElementById('confirmAuthButton');
    modalElements.cancelAuthButton = document.getElementById('cancelAuthButton');
    modalElements.authButtonText = document.getElementById('authButtonText');
    modalElements.authLoadingSpinner = document.getElementById('authLoadingSpinner');

    // Create User Modal Elements
    modalElements.createUserModal = document.getElementById('createUserModal');
    modalElements.createUsernameInput = document.getElementById('createUsername');
    modalElements.createPasswordInput = document.getElementById('createPassword');
    modalElements.confirmCreateUserButton = document.getElementById('confirmCreateUserButton');
    modalElements.cancelCreateUserButton = document.getElementById('cancelCreateUserButton');
    modalElements.createUserButtonText = document.getElementById('createUserButtonText');
    modalElements.createUserLoadingSpinner = document.getElementById('createUserLoadingSpinner');

    // Update Password Modal Elements
    modalElements.updatePasswordModal = document.getElementById('updatePasswordModal');
    modalElements.updateOldPasswordInput = document.getElementById('updateOldPassword');
    modalElements.updateNewPasswordInput = document.getElementById('updateNewPassword');
    modalElements.confirmUpdatePasswordButton = document.getElementById('confirmUpdatePasswordButton');
    modalElements.cancelUpdatePasswordButton = document.getElementById('cancelUpdatePasswordButton');
    modalElements.updatePasswordButtonText = document.getElementById('updatePasswordButtonText');
    modalElements.updatePasswordLoadingSpinner = document.getElementById('updatePasswordLoadingSpinner');

    // Video Modal Elements
    modalElements.punchButton = document.getElementById('punchButton');
    modalElements.videoModalOverlay = document.getElementById('videoModalOverlay');
    modalElements.videoModalIframe = document.getElementById('videoModalIframe');
    modalElements.closeVideoModalButton = document.getElementById('closeVideoModalButton');
}

export function setupModalEventListeners() {
    // Insert Modal Functions
    modalElements.cancelInsertButton.addEventListener('click', () => closeModal(modalElements.insertModal));
    modalElements.confirmInsertButton.addEventListener('click', handleInsertSubmit);
    setupModalSubmitOnEnter([modalElements.insertTextarea], modalElements.confirmInsertButton);

    // Auth Modal Functions
    modalElements.cancelAuthButton.addEventListener('click', () => closeModal(modalElements.authModal));
    modalElements.confirmAuthButton.addEventListener('click', handleAuthSubmit);
    setupModalSubmitOnEnter([modalElements.authUsernameInput, modalElements.authPasswordInput], modalElements.confirmAuthButton);

    // Create User Modal Functions
    modalElements.cancelCreateUserButton.addEventListener('click', () => closeModal(modalElements.createUserModal));
    modalElements.confirmCreateUserButton.addEventListener('click', handleCreateUserSubmit);
    setupModalSubmitOnEnter([modalElements.createUsernameInput, modalElements.createPasswordInput], modalElements.confirmCreateUserButton);

    // Update Password Modal Functions
    modalElements.cancelUpdatePasswordButton.addEventListener('click', () => closeModal(modalElements.updatePasswordModal));
    modalElements.confirmUpdatePasswordButton.addEventListener('click', handleUpdatePasswordSubmit);
    setupModalSubmitOnEnter([modalElements.updateOldPasswordInput, modalElements.updateNewPasswordInput], modalElements.confirmUpdatePasswordButton);

    // Video Modal Functions
    modalElements.punchButton.addEventListener('click', openVideoModal);
    modalElements.closeVideoModalButton.addEventListener('click', closeVideoModal);
}

async function handleInsertSubmit() {
    const inputText = modalElements.insertTextarea.value.trim();
    if (!inputText) {
        addMessage("Vui lòng nhập nội dung.", "error"); 
        return;
    }
    modalElements.insertButtonText.classList.add('hidden');
    modalElements.insertLoadingSpinner.classList.remove('hidden');
    modalElements.confirmInsertButton.disabled = true;
    try {
        const webhookUrl = `${CONFIG.WEBHOOK_BASE_URL}/${CONFIG.ENDPOINTS.COMMANDS}`;
        const commandTextForWebhook = `/insert ${inputText}`; 
        const headers = { 'Content-Type': 'application/json' };
        if (appUser.isAuthenticated && appUser.token) {
            headers['Authorization'] = `Bearer ${appUser.token}`;
        }
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({ text: commandTextForWebhook })
        });
        const responseData = await response.json(); 
        if (response.ok) {
            addMessage(`Phản hồi từ server: ${JSON.stringify(responseData, null, 2)}`, 'webhook_response');
            closeModal(modalElements.insertModal);
        } else {
            addMessage(`Lỗi từ server: ${responseData.message || response.statusText}`, "error");
        }
    } catch (error) {
        addMessage(`Lỗi khi gửi lệnh /insert: ${error.message}`, "error");
    } finally {
        modalElements.insertButtonText.classList.remove('hidden');
        modalElements.insertLoadingSpinner.classList.add('hidden');
        modalElements.confirmInsertButton.disabled = false;
    }
}

async function handleAuthSubmit() {
    const username = modalElements.authUsernameInput.value.trim();
    const password = modalElements.authPasswordInput.value; 
    if (!username || !password) {
        addMessage("Vui lòng nhập tên đăng nhập và mật khẩu.", "error"); return;
    }
    modalElements.authButtonText.classList.add('hidden');
    modalElements.authLoadingSpinner.classList.remove('hidden');
    modalElements.confirmAuthButton.disabled = true;
    try {
        const webhookUrl = `${CONFIG.WEBHOOK_BASE_URL}/${CONFIG.ENDPOINTS.LOGIN}`;
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const responseData = await response.json(); 
        if (response.ok && responseData.errorCode === 0 && responseData.message === "Success" && responseData.data) {
            const userDataFromWebhook = responseData.data;
            Object.assign(appUser, {
                isAuthenticated: true,
                id: userDataFromWebhook.id,
                username: userDataFromWebhook.username,
                fullName: userDataFromWebhook.fullName,
                role: userDataFromWebhook.isAdmin ? 'admin' : 'user',
                token: userDataFromWebhook.token
            });
            saveAuthToLocalStorage(appUser); 
            addMessage(`Đăng nhập thành công! Chào mừng ${appUser.fullName || appUser.username} (Role: ${appUser.role}).`, 'response');
            updateAuthStatusUI();
            
            // Update command help and list - these will be imported when needed
            const { updateCommandHelpText, populateCommandList } = await import('./commands.js');
            updateCommandHelpText(); 
            populateCommandList(); 
            
            const welcomeMsg = document.getElementById('initialWelcomeMessage');
            if(welcomeMsg) welcomeMsg.remove();
            closeModal(modalElements.authModal);
        } else {
            addMessage(responseData.message || "Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.", "error");
        }
    } catch (error) {
        addMessage(`Lỗi kết nối hoặc xử lý đăng nhập: ${error.message}`, "error");
    } finally {
        modalElements.authButtonText.classList.remove('hidden');
        modalElements.authLoadingSpinner.classList.add('hidden');
        modalElements.confirmAuthButton.disabled = false;
    }
}

async function handleCreateUserSubmit() {
    const newUsername = modalElements.createUsernameInput.value.trim();
    const newPassword = modalElements.createPasswordInput.value;
    if (!newUsername || !newPassword) {
        addMessage("Vui lòng nhập tên đăng nhập và mật khẩu mới.", "error"); return;
    }
    modalElements.createUserButtonText.classList.add('hidden');
    modalElements.createUserLoadingSpinner.classList.remove('hidden');
    modalElements.confirmCreateUserButton.disabled = true;
    try {
        const webhookUrl = `${CONFIG.WEBHOOK_BASE_URL}/${CONFIG.ENDPOINTS.COMMANDS}`;
        const commandTextForWebhook = `/create_user ${newUsername} ${newPassword}`;
        const headers = { 'Content-Type': 'application/json' };
        if (appUser.isAuthenticated && appUser.token) {
            headers['Authorization'] = `Bearer ${appUser.token}`;
        }
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({ text: commandTextForWebhook })
        });
        const responseData = await response.json();
        if (response.ok) {
            addMessage(`Phản hồi tạo người dùng: ${JSON.stringify(responseData, null, 2)}`, 'webhook_response');
            closeModal(modalElements.createUserModal);
        } else {
            addMessage(`Lỗi tạo người dùng: ${responseData.message || response.statusText}`, "error");
        }
    } catch (error) {
        addMessage(`Lỗi khi tạo người dùng: ${error.message}`, "error");
    } finally {
        modalElements.createUserButtonText.classList.remove('hidden');
        modalElements.createUserLoadingSpinner.classList.add('hidden');
        modalElements.confirmCreateUserButton.disabled = false;
    }
}

async function handleUpdatePasswordSubmit() {
    const oldPassword = modalElements.updateOldPasswordInput.value;
    const newPassword = modalElements.updateNewPasswordInput.value;
    if (!oldPassword || !newPassword) {
        addMessage("Vui lòng nhập mật khẩu cũ và mật khẩu mới.", "error"); return;
    }
    if (oldPassword === newPassword) {
        addMessage("Mật khẩu mới phải khác mật khẩu cũ.", "error"); return;
    }
    modalElements.updatePasswordButtonText.classList.add('hidden');
    modalElements.updatePasswordLoadingSpinner.classList.remove('hidden');
    modalElements.confirmUpdatePasswordButton.disabled = true;
    try {
        const webhookUrl = `${CONFIG.WEBHOOK_BASE_URL}/${CONFIG.ENDPOINTS.COMMANDS}`;
        const commandTextForWebhook = `/update_password ${oldPassword} ${newPassword}`;
        const headers = { 'Content-Type': 'application/json' };
        if (appUser.isAuthenticated && appUser.token) {
            headers['Authorization'] = `Bearer ${appUser.token}`;
        }
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({ text: commandTextForWebhook })
        });
        const responseData = await response.json();
        if (response.ok) {
            addMessage(`Phản hồi cập nhật mật khẩu: ${JSON.stringify(responseData, null, 2)}`, 'webhook_response');
            closeModal(modalElements.updatePasswordModal);
        } else {
            addMessage(`Lỗi cập nhật mật khẩu: ${responseData.message || response.statusText}`, "error");
        }
    } catch (error) {
        addMessage(`Lỗi khi cập nhật mật khẩu: ${error.message}`, "error");
    } finally {
        modalElements.updatePasswordButtonText.classList.remove('hidden');
        modalElements.updatePasswordLoadingSpinner.classList.add('hidden');
        modalElements.confirmUpdatePasswordButton.disabled = false;
    }
}

function openVideoModal() {
    const videoUrl = "https://www.youtube.com/embed/dQw4w9WgXcQ?si=Eo_EAjawJqNMbw0X?autoplay=1&mute=1"; 
    modalElements.videoModalIframe.src = videoUrl;
    modalElements.videoModalOverlay.style.display = 'flex';
    modalElements.videoModalOverlay.classList.remove('hidden');
}

function closeVideoModal() {
    modalElements.videoModalIframe.src = ""; // Stop video playback
    modalElements.videoModalOverlay.classList.add('hidden');
    modalElements.videoModalOverlay.style.display = 'none';
}

// Export modal opening functions for external use
export function openInsertModal() {
    openModal(modalElements.insertModal, modalElements.insertTextarea);
}

export function openAuthModal() {
    openModal(modalElements.authModal, modalElements.authUsernameInput);
}

export function openCreateUserModal() {
    openModal(modalElements.createUserModal, modalElements.createUsernameInput);
}

export function openUpdatePasswordModal() {
    openModal(modalElements.updatePasswordModal, modalElements.updateOldPasswordInput);
} 