import { AVAILABLE_COMMANDS, CONFIG } from './constants.js';
import { appUser, logout, updateAuthStatusUI } from './auth.js';
import { addMessage } from './ui-utils.js';
import { openAuthModal, openInsertModal, openCreateUserModal, openUpdatePasswordModal } from './modals.js';

let commandInput, commandListPopup, commandHelpText, terminalIcon, commandButtonsContainer, commandSuggestions;
let selectedSuggestionIndex = -1;
let stickyMenuCard = null;

export function initializeCommandElements() {
    commandInput = document.getElementById('commandInput');
    commandListPopup = document.getElementById('commandListPopup');
    commandHelpText = document.getElementById('commandHelpText');
    terminalIcon = document.getElementById('terminalIcon');
    commandSuggestions = document.getElementById('commandSuggestions');
    
    // Create command buttons container
    createCommandButtonsContainer();
    setupInputAutoSlash();
}

function createCommandButtonsContainer() {
    // Find footer element to insert before it
    const footer = document.querySelector('footer');
    
    // Create container for command buttons
    commandButtonsContainer = document.createElement('div');
    commandButtonsContainer.id = 'commandButtonsContainer';
    commandButtonsContainer.className = 'fixed bottom-24 left-1/2 transform -translate-x-1/2 bg-[#131712]/90 backdrop-blur-md border border-[#2D372A] rounded-lg p-2 flex flex-wrap gap-1 max-w-md z-20';
    
    // Create toggle button
    const toggleButton = document.createElement('button');
    toggleButton.id = 'toggleCommandsButton';
    toggleButton.className = 'fixed bottom-[5.8rem] right-4 bg-[#2D372A] text-[#A5B6A0] p-2 rounded-full hover:bg-[#53d22c] hover:text-black transition-colors z-20 border border-[#53d22c]';
    toggleButton.innerHTML = '⌘';
    toggleButton.title = 'Ẩn/Hiện lệnh nhanh';
    
    // Add click event for toggle
    toggleButton.addEventListener('click', () => {
        commandButtonsContainer.classList.toggle('hidden');
        // Save state to localStorage
        const isHidden = commandButtonsContainer.classList.contains('hidden');
        localStorage.setItem('commandButtonsHidden', isHidden.toString());
    });
    
    // Load saved state from localStorage
    const savedState = localStorage.getItem('commandButtonsHidden');
    if (savedState === 'true') {
        commandButtonsContainer.classList.add('hidden');
    }
    
    // Insert into body
    document.body.appendChild(commandButtonsContainer);
    document.body.appendChild(toggleButton);
    
    // Update command buttons
    updateCommandButtons();
}

function updateCommandButtons() {
    if (!commandButtonsContainer) return;
    
    commandButtonsContainer.innerHTML = '';
    const relevantCommands = AVAILABLE_COMMANDS.filter(cmdObj => 
        appUser.isAuthenticated ? cmdObj.allowedRoles.includes(appUser.role) || cmdObj.allowedRoles.includes('all') : cmdObj.allowedRoles.includes('guest')
    );

    relevantCommands.forEach(cmdObj => {
        const button = document.createElement('button');
        button.textContent = cmdObj.name;
        button.className = 'bg-[#2D372A] text-[#A5B6A0] px-2 py-1 rounded text-xs hover:bg-[#53d22c] hover:text-black transition-colors';
        button.addEventListener('click', () => {
            handleCommand(cmdObj.name);
        });
        commandButtonsContainer.appendChild(button);
    });
}

function setupInputAutoSlash() {
    commandInput.addEventListener('focus', () => {
        if (!commandInput.value.startsWith('/') && commandInput.value.trim() === '') {
            commandInput.value = '/';
        }
    });
    
    commandInput.addEventListener('input', () => {
        if (commandInput.value && !commandInput.value.startsWith('/')) {
            commandInput.value = '/' + commandInput.value;
        }
    });
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
    
    // Update command buttons as well
    updateCommandButtons();
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
    
    // Update command buttons as well
    updateCommandButtons();
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
            
            // Hide sticky menu card when logout
            hideStickyMenuCard();
            
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
    
    // Scroll to bottom to show loading message
    const mainChatArea = document.getElementById('mainChatArea');
    mainChatArea.scrollTo({ top: mainChatArea.scrollHeight, behavior: 'smooth' });

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
            // Check if response has the expected structure: { errorCode: 0, message: "Success", data: [...] }
            if (responseData && responseData.errorCode === 0 && responseData.data && Array.isArray(responseData.data)) {
                // Create sticky menu card
                createStickyMenuCard(responseData.data);
                
                // Add confirmation message
                addMessage(`✅ <strong>MENU ĐÃ TẢI THÀNH CÔNG!</strong><br><br>📌 Menu hôm nay đã được hiển thị ở đầu chat. Bạn có thể click trực tiếp vào món để đặt hàng!`, 'response', true);
            } else if (typeof responseData === 'string') {
                addMessage(`📜 <strong>MENU HÔM NAY</strong><br><br>${responseData.replace(/\n/g, "<br>")}`, 'menu_item', true); 
            } else if (Array.isArray(responseData)) {
                // Fallback for direct array response
                createStickyMenuCard(responseData);
                addMessage(`✅ <strong>MENU ĐÃ TẢI THÀNH CÔNG!</strong><br><br>📌 Menu hôm nay đã được hiển thị ở đầu chat.`, 'response', true);
            } else if (typeof responseData === 'object' && responseData !== null) {
                 addMessage(`📜 <strong>MENU HÔM NAY</strong><br><br>${JSON.stringify(responseData, null, 2)}`, 'menu_item', true); 
            } else {
                addMessage("❌ Không có dữ liệu menu hoặc định dạng không xác định.", "error");
            }
        } else {
            addMessage(`❌ Lỗi khi tải menu từ server: ${responseData.message || response.statusText}`, "error");
        }
    } catch (error) {
        const loadingElement = document.getElementById(loadingId);
        if(loadingElement) loadingElement.remove();
        addMessage(`❌ Lỗi khi tải menu: ${error.message}`, "error");
    }
}

export async function sendAddCommand(itemId) {
    addMessage(`/add_${itemId}`, 'command');
    
    try {
        const webhookUrl = `${CONFIG.WEBHOOK_BASE_URL}/${CONFIG.ENDPOINTS.COMMANDS}`;
        const headers = { 'Content-Type': 'application/json' };
        if (appUser.isAuthenticated && appUser.token) {
            headers['Authorization'] = `Bearer ${appUser.token}`;
        }
        const response = await fetch(webhookUrl, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({ text: `/add_${itemId}` })
        });
        const responseData = await response.json();
        
        if (response.ok) {
            if (responseData && responseData.errorCode === 0) {
                addMessage(`🍽️ <strong>ĐÃ THÊM MÓN VÀO ĐƠN HÀNG!</strong><br><br>Món ăn đã được thêm vào danh sách đặt hàng của bạn.`, 'webhook_response', true);
            } else {
                const formattedResponse = formatServerResponse(`/add_${itemId}`, responseData);
                addMessage(formattedResponse, 'webhook_response', true);
            }
        } else {
            addMessage(`❌ Lỗi khi thêm món: ${responseData.message || response.statusText}`, "error");
        }
    } catch (error) {
        addMessage(`❌ Lỗi khi thêm món: ${error.message}`, "error");
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
            const formattedResponse = formatServerResponse(command, responseData);
            addMessage(formattedResponse, 'webhook_response', true);
        } else {
            addMessage(`Lỗi từ server cho lệnh "${command}": ${responseData.message || response.statusText}`, "error");
        }
    } catch (error) {
         const loadingElement = document.getElementById(loadingId);
         if(loadingElement) loadingElement.remove();
        addMessage(`Lỗi khi gửi lệnh "${command}": ${error.message}`, "error");
    }
}

export function setupCommandSuggestions() {
    commandInput.addEventListener('input', handleInputChange);
    commandInput.addEventListener('keydown', handleKeyDown);
    
    // Hide suggestions when clicking outside
    document.addEventListener('click', (e) => {
        if (!commandInput.contains(e.target) && !commandSuggestions.contains(e.target)) {
            hideSuggestions();
        }
    });
}

function handleInputChange() {
    const inputValue = commandInput.value;
    
    if (inputValue.startsWith('/') && inputValue.length > 1) {
        showCommandSuggestions(inputValue);
    } else {
        hideSuggestions();
    }
}

function handleKeyDown(e) {
    const suggestions = commandSuggestions.querySelectorAll('.command-suggestion-item');
    
    if (suggestions.length === 0) return;
    
    switch (e.key) {
        case 'ArrowDown':
            e.preventDefault();
            selectedSuggestionIndex = Math.min(selectedSuggestionIndex + 1, suggestions.length - 1);
            updateSuggestionHighlight(suggestions);
            break;
            
        case 'ArrowUp':
            e.preventDefault();
            selectedSuggestionIndex = Math.max(selectedSuggestionIndex - 1, -1);
            updateSuggestionHighlight(suggestions);
            break;
            
        case 'Tab':
            e.preventDefault();
            if (selectedSuggestionIndex >= 0) {
                selectSuggestion(suggestions[selectedSuggestionIndex]);
            }
            break;
            
        case 'Escape':
            hideSuggestions();
            break;
    }
}

function showCommandSuggestions(inputValue) {
    const searchTerm = inputValue.slice(1).toLowerCase(); // Remove '/' and convert to lowercase
    
    const relevantCommands = AVAILABLE_COMMANDS.filter(cmdObj => {
        const hasPermission = appUser.isAuthenticated ? 
            cmdObj.allowedRoles.includes(appUser.role) || cmdObj.allowedRoles.includes('all') : 
            cmdObj.allowedRoles.includes('guest');
        
        return hasPermission && cmdObj.name.toLowerCase().includes(searchTerm);
    });
    
    if (relevantCommands.length === 0) {
        hideSuggestions();
        return;
    }
    
    commandSuggestions.innerHTML = '';
    selectedSuggestionIndex = -1;
    
    relevantCommands.forEach((cmdObj, index) => {
        const suggestionItem = document.createElement('div');
        suggestionItem.className = 'command-suggestion-item';
        suggestionItem.innerHTML = `
            <div class="font-medium">${cmdObj.name}</div>
            <div class="text-xs opacity-75">${cmdObj.desc}</div>
        `;
        
        suggestionItem.addEventListener('click', () => selectSuggestion(suggestionItem));
        suggestionItem.dataset.command = cmdObj.name;
        
        commandSuggestions.appendChild(suggestionItem);
    });
    
    commandSuggestions.classList.remove('hidden');
}

function updateSuggestionHighlight(suggestions) {
    suggestions.forEach((item, index) => {
        if (index === selectedSuggestionIndex) {
            item.classList.add('highlighted');
        } else {
            item.classList.remove('highlighted');
        }
    });
}

function selectSuggestion(suggestionElement) {
    const command = suggestionElement.dataset.command;
    commandInput.value = command;
    hideSuggestions();
    commandInput.focus();
    
    // Set cursor to end
    setTimeout(() => {
        commandInput.setSelectionRange(command.length, command.length);
    }, 0);
}

function hideSuggestions() {
    commandSuggestions.classList.add('hidden');
    selectedSuggestionIndex = -1;
}

// Format server responses based on command type
function formatServerResponse(command, responseData) {
    const commandName = command.trim().split(' ')[0];
    
    // Check if response has expected structure
    if (!responseData || typeof responseData !== 'object' || responseData.errorCode === undefined) {
        return JSON.stringify(responseData, null, 2);
    }
    
    // Success responses
    if (responseData.errorCode === 0) {
        switch (commandName) {
            case '/aggregate':
                if (responseData.message) {
                    return `📊 <strong>THỐNG KÊ ĐƠN HÀNG</strong><br><br>${responseData.message.replace(/\n/g, '<br>')}<br><em>💡 Tổng hợp các món đã được đặt</em>`;
                }
                break;
                
            case '/delete':
                return `🗑️ XÓA THÀNH CÔNG!\n\nĐã xóa các món vừa đặt khỏi đơn hàng.`;
                
            case '/lock':
                return `🔒 <strong>KHÓA THÀNH CÔNG!</strong><br><br>Hệ thống đã khóa, không thể đặt thêm món nữa.`;
                
            case '/unlock':
                return `🔓 <strong>MỞ KHÓA THÀNH CÔNG!</strong><br><br>Hệ thống đã mở khóa, có thể đặt món trở lại.`;
                
            case '/create_user':
                return `👤 <strong>TẠO NGƯỜI DÙNG THÀNH CÔNG!</strong><br><br>Đã tạo tài khoản mới thành công.`;
                
            case '/update_password':
                return `🔐 <strong>CẬP NHẬT MẬT KHẨU THÀNH CÔNG!</strong><br><br>Mật khẩu đã được thay đổi thành công.`;
                
            case '/publish':
                return `📢 <strong>XUẤT BẢN THÀNH CÔNG!</strong><br><br>Menu đã được xuất bản và sẵn sàng phục vụ.`;
                
            default:
                if (responseData.message && responseData.message !== "Success") {
                    return `✅ <strong>THÀNH CÔNG!</strong><br><br>${responseData.message}`;
                } else {
                    return `✅ <strong>THÀNH CÔNG!</strong><br><br>Lệnh "${command}" đã được thực hiện thành công.`;
                }
        }
    }
    
    // Error responses
    if (responseData.errorCode !== 0) {
        return `❌ <strong>LỖI!</strong><br><br>${responseData.message || 'Có lỗi xảy ra khi thực hiện lệnh.'}`;
    }
    
    // Fallback to JSON format
    return JSON.stringify(responseData, null, 2);
}

// Create and manage sticky menu card
function createStickyMenuCard(menuData) {
    const messageContainer = document.getElementById('messageContainer');
    
    // Remove existing sticky menu if any
    const existingStickyMenu = document.querySelector('.sticky-menu-card');
    if (existingStickyMenu) {
        existingStickyMenu.remove();
    }
    
    // Only show for authenticated users with menu data
    if (!appUser.isAuthenticated || !menuData || !Array.isArray(menuData) || menuData.length === 0) {
        return;
    }
    
    // Create sticky menu card
    stickyMenuCard = document.createElement('div');
    stickyMenuCard.className = 'sticky-menu-card';
    stickyMenuCard.id = 'stickyMenuCard';
    
    // Create header with title and toggle
    const header = document.createElement('div');
    header.className = 'sticky-menu-header';
    
    const title = document.createElement('div');
    title.className = 'sticky-menu-title';
    title.innerHTML = '📌 MENU HÔM NAY';
    
    const toggleButton = document.createElement('button');
    toggleButton.className = 'sticky-menu-toggle';
    toggleButton.textContent = '−';
    toggleButton.title = 'Thu gọn/Mở rộng menu';
    
    // Toggle functionality
    toggleButton.addEventListener('click', () => {
        stickyMenuCard.classList.toggle('collapsed');
        toggleButton.textContent = stickyMenuCard.classList.contains('collapsed') ? '+' : '−';
        
        // Save state to localStorage
        const isCollapsed = stickyMenuCard.classList.contains('collapsed');
        localStorage.setItem('stickyMenuCollapsed', isCollapsed.toString());
    });
    
    header.appendChild(title);
    header.appendChild(toggleButton);
    
    // Create menu items container
    const menuItemsContainer = document.createElement('div');
    menuItemsContainer.className = 'sticky-menu-items';
    
    // Create menu items
    menuData.forEach((item, index) => {
        const menuItem = document.createElement('button');
        menuItem.className = 'sticky-menu-item';
        menuItem.dataset.id = item.id || (index + 1);
        
        const itemName = item.name || `Món ${index + 1}`;
        const itemPrice = item.price ? new Intl.NumberFormat('vi-VN', { 
            style: 'currency', 
            currency: 'VND' 
        }).format(item.price) : "";
        
        menuItem.innerHTML = `
            <div class="sticky-menu-item-name">${itemName}</div>
            ${itemPrice ? `<div class="sticky-menu-item-price">${itemPrice}</div>` : ''}
        `;
        
        menuItem.title = itemName; // Full name on hover
        
        // Add click event
        menuItem.addEventListener('click', async () => {
            const itemId = menuItem.getAttribute('data-id');
            await sendAddCommand(itemId);
        });
        
        menuItemsContainer.appendChild(menuItem);
    });
    // Assemble the card
    stickyMenuCard.appendChild(header);
    stickyMenuCard.appendChild(menuItemsContainer);
    
    // Insert at the beginning of message container
    messageContainer.insertBefore(stickyMenuCard, messageContainer.firstChild);
    
    // Load saved collapsed state
    const savedCollapsedState = localStorage.getItem('stickyMenuCollapsed');
    if (savedCollapsedState === 'true') {
        stickyMenuCard.classList.add('collapsed');
        toggleButton.textContent = '+';
    }
}

function hideStickyMenuCard() {
    const existingStickyMenu = document.querySelector('.sticky-menu-card');
    if (existingStickyMenu) {
        existingStickyMenu.classList.add('hidden');
    }
}

function showStickyMenuCard() {
    const existingStickyMenu = document.querySelector('.sticky-menu-card');
    if (existingStickyMenu) {
        existingStickyMenu.classList.remove('hidden');
    }
}

// Export createStickyMenuCard for use in other modules
export { createStickyMenuCard, hideStickyMenuCard, showStickyMenuCard }; 