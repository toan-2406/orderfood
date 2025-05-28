import { initializeAuth } from './auth.js';
import { initializeModalElements, setupModalEventListeners } from './modals.js';
import { initializeCommandElements, setupCommandListeners, updateCommandHelpText, populateCommandList, handleCommand, setupCommandSuggestions } from './commands.js';
import { alignFooterToBody } from './ui-utils.js';

let commandInput, sendCommandButton;

document.addEventListener('DOMContentLoaded', async function() {
    // Initialize all modules
    initializeAuth();
    initializeModalElements();
    initializeCommandElements();
    
    commandInput = document.getElementById('commandInput');
    sendCommandButton = document.getElementById('sendCommandButton');
    
    // Setup event listeners
    setupModalEventListeners();
    setupCommandListeners();
    setupCommandSuggestions();
    
    // Setup command input handlers
    setupCommandInputHandlers();
    
    // Initialize UI
    updateCommandHelpText();
    populateCommandList();
    alignFooterToBody();
    
    // Auto load menu for authenticated users on page load
    await autoLoadMenuOnReload();
    
    // Handle window resize for footer alignment
    window.addEventListener('resize', alignFooterToBody);
});

function setupCommandInputHandlers() {
    sendCommandButton.addEventListener('click', () => {
        const command = commandInput.value.trim();
        if (command) {
            handleCommand(command);
            commandInput.value = '';
        }
        commandInput.focus();
    });

    commandInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            const command = commandInput.value.trim();
            if (command) {
                handleCommand(command);
                commandInput.value = '';
            }
        }
    });
}

async function autoLoadMenuOnReload() {
    const { appUser } = await import('./auth.js');
    const { addMessage } = await import('./ui-utils.js');
    
    // Check if user is authenticated and load menu automatically
    if (appUser.isAuthenticated) {
        // Remove welcome message first
        const welcomeMsg = document.getElementById('initialWelcomeMessage');
        if (welcomeMsg) welcomeMsg.remove();
        
        // Auto load menu for all authenticated users
        addMessage(`🔄 Đang tải menu tự động...`, 'response', true);
        
        try {
            const { CONFIG } = await import('./constants.js');
            const webhookUrl = `${CONFIG.WEBHOOK_BASE_URL}/${CONFIG.ENDPOINTS.COMMANDS}`;
            const headers = { 'Content-Type': 'application/json' };
            if (appUser.token) {
                headers['Authorization'] = `Bearer ${appUser.token}`;
            }
            
            const response = await fetch(webhookUrl, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({ text: "/menu" }) 
            });
            const responseData = await response.json();
            
            if (response.ok) {
                // Check if response has menu data
                if (responseData && responseData.errorCode === 0 && responseData.data && Array.isArray(responseData.data) && responseData.data.length > 0) {
                    let menuDisplay = "<strong>📜 MENU HÔM NAY 📜</strong><br><br>";
                    responseData.data.forEach((item, index) => {
                        const itemName = item.name || `Món ${index + 1}`;
                        const itemPrice = item.price || "";
                        const itemId = item.id || (index + 1);
                        menuDisplay += `<div class="menu-item mb-2">`;
                        menuDisplay += `<strong>${index + 1}. ${itemName}</strong> ${itemPrice ? `- ${itemPrice}đ` : ''}`;
                        
                        // Add selection button for all authenticated users
                        menuDisplay += ` <button class="menu-item-button" data-id="${itemId}">Chọn món này</button>`;
                        menuDisplay += `</div>`;
                    });
                    menuDisplay += `<br><em>💡 Tip: Click "Chọn món này" để thêm món vào đơn hàng!</em>`;
                    addMessage(menuDisplay, 'menu_item', true);
                    
                    // Add event listeners to menu buttons after message is added
                    setTimeout(async () => {
                        const { sendAddCommand } = await import('./commands.js');
                        const menuButtons = document.querySelectorAll('.menu-item-button');
                        menuButtons.forEach(button => {
                            button.addEventListener('click', async (e) => {
                                const itemId = e.target.getAttribute('data-id');
                                await sendAddCommand(itemId);
                            });
                        });
                    }, 100);
                } else {
                    // No menu available
                    addMessage(`😔 <strong>Thông báo:</strong><br><br>Hôm nay chưa có menu nào được cập nhật.<br>Vui lòng sử dụng lệnh <code>/help</code> để xem các lệnh khác.`, 'response', true);
                }
            } else {
                addMessage(`⚠️ Không thể tải menu: ${responseData.message || response.statusText}`, 'error', true);
            }
        } catch (error) {
            addMessage(`⚠️ Lỗi khi tải menu: ${error.message}`, 'error', true);
        }
    }
} 