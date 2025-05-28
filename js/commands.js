import { AVAILABLE_COMMANDS, CONFIG } from './constants.js';
import { appUser, logout, updateAuthStatusUI } from './auth.js';
import { addMessage } from './ui-utils.js';
import { openAuthModal, openInsertModal, openCreateUserModal, openUpdatePasswordModal } from './modals.js';

let commandInput, commandListPopup, commandHelpText, terminalIcon;

export function initializeCommandElements() {
    commandInput = document.getElementById('commandInput');
    commandListPopup = document.getElementById('commandListPopup');
    commandHelpText = document.getElementById('commandHelpText');
    terminalIcon = document.getElementById('terminalIcon');
}

export function updateCommandHelpText() {
    commandHelpText.innerHTML = 'Lệnh: ';
    const relevantCommands = AVAILABLE_COMMANDS.filter(cmdObj => 
        appUser.isAuthenticated ? cmdObj.allowedRoles.includes(appUser.role) || cmdObj.allowedRoles.includes('all') : cmdObj.allowedRoles.includes('guest')
    );

    relevantCommands.forEach((cmdObj, index) => {
        const code = document.createElement('code');
        code.className = 'text-[#798874]';
        code.textContent = cmdObj.name;
        commandHelpText.appendChild(code);
        if (index < relevantCommands.length - 1) {
            commandHelpText.append(', ');
        }
    });
}

export function populateCommandList() {
    commandListPopup.innerHTML = '';
    const relevantCommands = AVAILABLE_COMMANDS.filter(cmdObj => 
         appUser.isAuthenticated ? cmdObj.allowedRoles.includes(appUser.role) || cmdObj.allowedRoles.includes('all') : cmdObj.allowedRoles.includes('guest')
    );

    relevantCommands.forEach(cmdObj => {
        const commandItem = document.createElement('div');
        commandItem.textContent = `${cmdObj.name} - ${cmdObj.desc}`;
        commandItem.classList.add('text-[#A5B6A0]', 'text-sm', 'p-2', 'rounded-md', 'hover:bg-[#2D372A]', 'cursor-pointer', 'command-item');
        commandItem.addEventListener('click', () => {
            let value = cmdObj.name;
            if (!cmdObj.opensDialog && cmdObj.name !== '/help' && cmdObj.name !== '/logout' && cmdObj.name !== '/menu') { 
                value += ' ';
            }
            commandInput.value = value;
            commandListPopup.classList.add('hidden');
            commandInput.focus();
        });
        commandListPopup.appendChild(commandItem);
    });
}

export function setupCommandListeners() {
    terminalIcon.addEventListener('click', (event) => {
        event.stopPropagation();
        populateCommandList(); 
        commandListPopup.classList.toggle('hidden');
    });

    document.addEventListener('click', (event) => {
        if (!commandListPopup.classList.contains('hidden') &&
            !commandListPopup.contains(event.target) &&
            event.target !== terminalIcon) {
            commandListPopup.classList.add('hidden');
        }
    });
}

export async function handleCommand(command) {
    const commandName = command.trim().split(' ')[0];
    const commandObj = AVAILABLE_COMMANDS.find(c => c.name === commandName);

    let isAllowed = false;
    if (appUser.isAuthenticated) {
        if (commandObj && (commandObj.allowedRoles.includes(appUser.role) || commandObj.allowedRoles.includes('all'))) {
            isAllowed = true;
        } else if (!commandObj && appUser.role === 'admin') { 
            isAllowed = true; 
        }
    } else { 
        if (commandObj && commandObj.allowedRoles.includes('guest')) {
            isAllowed = true;
        }
    }

    if (!isAllowed) {
        addMessage(`Lệnh "${commandName}" không hợp lệ hoặc bạn không có quyền thực hiện. Gõ /help để xem các lệnh.`, "error");
        commandInput.value = ''; 
        return;
    }
    
    addMessage(command, 'command'); 
    
    if (commandName === '/auth') {
        openAuthModal();
        return;
    } else if (commandName === '/logout') {
        if (appUser.isAuthenticated) {
            const oldUsername = logout();
            updateAuthStatusUI();
            updateCommandHelpText(); 
            populateCommandList(); 
            addMessage(`Người dùng ${oldUsername} đã đăng xuất.`, 'response');
            const welcomeMsg = document.getElementById('initialWelcomeMessage');
            const messageContainer = document.getElementById('messageContainer');
            if (!welcomeMsg && messageContainer.children.length === 1) { 
                 messageContainer.innerHTML = `
                    <div id="initialWelcomeMessage" class="bg-[#1A1F18] p-4 rounded-lg shadow-md">
                        <p class="text-[#A5B6A0] text-sm">Bạn đã đăng xuất.</p>
                        <p class="text-[#A5B6A0] text-sm mt-1">Vui lòng sử dụng lệnh <code class="text-[#53d22c] bg-[#2D372A] px-1 py-0.5 rounded-sm">/auth</code> để đăng nhập lại.</p>
                        <p class="text-[#A5B6A0] text-xs mt-2">Gõ <code class="text-[#798874]">/help</code> để xem các lệnh.</p>
                    </div>`;
            }
        } else {
            addMessage("Bạn chưa đăng nhập.", "error");
        }
        return;
    } else if (commandName === '/insert') { 
        openInsertModal(); 
        return; 
    } else if (commandName === '/create_user') {
        openCreateUserModal();
        return;
    } else if (commandName === '/update_password') {
        openUpdatePasswordModal();
        return;
    } else if (commandName === '/menu') { 
        await handleMenuCommand();
        return;
    } else if (commandName === '/help') {
        handleHelpCommand();
        return;
    }
    else { 
        if (appUser.isAuthenticated && appUser.role === 'admin' && command.trim().startsWith('/')) {
            await handleWebhookCommand(command);
        } else {
            addMessage(`Lệnh không xác định hoặc không được phép: "${command}". Gõ /help để xem các lệnh.`, 'error');
        }
    }
}

async function handleMenuCommand() {
    const messageContainer = document.getElementById('messageContainer');
    const loadingId = `loading-webhook-menu-${Date.now()}`;
    const tempLoadingMsg = document.createElement('div');
    tempLoadingMsg.id = loadingId;
    tempLoadingMsg.classList.add('bg-[#1A1F18]', 'p-3', 'rounded-lg', 'shadow-md', 'mb-2', 'mr-auto', 'max-w-[70%]');
    tempLoadingMsg.innerHTML = `<p class="text-[#A5B6A0] text-sm flex items-center">Đang tải menu từ server <span class="loading-dots ml-1"><span>.</span><span>.</span><span>.</span></span></p>`;
    messageContainer.appendChild(tempLoadingMsg);
    messageContainer.scrollTop = messageContainer.scrollHeight;

    try {
        const webhookUrl = `${CONFIG.WEBHOOK_BASE_URL}/${CONFIG.ENDPOINTS.COMMANDS}`;
        const headers = { 'Content-Type': 'application/json' };
        if (appUser.isAuthenticated && appUser.token) {
            headers['Authorization'] = `Bearer ${appUser.token}`;
        }
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({ text: "/menu" }) 
        });
        const loadingElement = document.getElementById(loadingId);
        if(loadingElement) loadingElement.remove();
        const responseData = await response.json();
        if (response.ok) {
            let menuDisplay = "<strong>📜 DANH SÁCH MENU (từ Server) 📜</strong>\n\n";
            if (typeof responseData === 'string') {
                menuDisplay += responseData.replace(/\n/g, "<br>"); 
            } else if (Array.isArray(responseData)) {
                 responseData.forEach((item, index) => {
                    const itemName = item.name || item.itemName || `Món ${index + 1}`;
                    const itemPrice = item.price || item.itemPrice || "";
                    menuDisplay += `<strong>${index + 1}. ${itemName}</strong> ${itemPrice ? `- ${itemPrice}` : ''}\n`;
                });
            } else if (typeof responseData === 'object' && responseData !== null) {
                 menuDisplay += JSON.stringify(responseData, null, 2); 
            } else {
                menuDisplay += "Không có dữ liệu menu hoặc định dạng không xác định.";
            }
            addMessage(menuDisplay, 'menu_item', true);
        } else {
            addMessage(`Lỗi khi tải menu từ server: ${responseData.message || response.statusText}`, "error");
        }
    } catch (error) {
        const loadingElement = document.getElementById(loadingId);
        if(loadingElement) loadingElement.remove();
        addMessage(`Lỗi khi tải menu: ${error.message}`, "error");
    }
}

function handleHelpCommand() {
    let helpMessage = "<strong>Các lệnh có sẵn:</strong>\n";
     const relevantCommandsForHelp = AVAILABLE_COMMANDS.filter(cmdObj => 
        appUser.isAuthenticated ? cmdObj.allowedRoles.includes(appUser.role) || cmdObj.allowedRoles.includes('all') : cmdObj.allowedRoles.includes('guest')
    );
    relevantCommandsForHelp.forEach(cmdObj => {
        helpMessage += `- <strong>${cmdObj.name}</strong>: ${cmdObj.desc}\n`;
    });
    addMessage(helpMessage, 'response', true);
}

async function handleWebhookCommand(command) {
    const messageContainer = document.getElementById('messageContainer');
    const loadingId = `loading-webhook-${Date.now()}`; 
    const tempLoadingMsg = document.createElement('div');
    tempLoadingMsg.id = loadingId;
    tempLoadingMsg.classList.add('bg-[#1A1F18]', 'p-3', 'rounded-lg', 'shadow-md', 'mb-2', 'mr-auto', 'max-w-[70%]');
    tempLoadingMsg.innerHTML = `<p class="text-[#A5B6A0] text-sm flex items-center">Đang gửi lệnh "${command}" <span class="loading-dots ml-1"><span>.</span><span>.</span><span>.</span></span></p>`;
    messageContainer.appendChild(tempLoadingMsg);
    messageContainer.scrollTop = messageContainer.scrollHeight;
    try {
        const webhookUrl = `${CONFIG.WEBHOOK_BASE_URL}/${CONFIG.ENDPOINTS.COMMANDS}`;
        const headers = { 'Content-Type': 'application/json' };
        if (appUser.isAuthenticated && appUser.token) {
            headers['Authorization'] = `Bearer ${appUser.token}`;
        }
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({ text: command.trim() }) 
        });
        const loadingElement = document.getElementById(loadingId);
        if(loadingElement) loadingElement.remove();
        const responseData = await response.json();
        if (response.ok) {
            addMessage(`Phản hồi từ server cho lệnh "${command}": ${JSON.stringify(responseData, null, 2)}`, 'webhook_response');
        } else {
            addMessage(`Lỗi từ server cho lệnh "${command}": ${responseData.message || response.statusText}`, "error");
        }
    } catch (error) {
         const loadingElement = document.getElementById(loadingId);
         if(loadingElement) loadingElement.remove();
        addMessage(`Lỗi khi gửi lệnh "${command}": ${error.message}`, "error");
    }
} 