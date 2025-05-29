import { initializeAuth } from './auth.js';
import { initializeModalElements, setupModalEventListeners } from './modals.js';
import { initializeCommandElements, setupCommandListeners, updateCommandHelpText, populateCommandList, handleCommand, setupCommandSuggestions } from './commands.js';
import { alignFooterToBody } from './ui-utils.js';
import { initializeWheelOfFortune, updateRandomFoodButtonVisibility } from './wheel-fortune.js';

let commandInput, sendCommandButton;

document.addEventListener('DOMContentLoaded', async function() {
    // Initialize all modules
    initializeAuth();
    initializeModalElements();
    initializeCommandElements();
    initializeWheelOfFortune();
    
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
            const { createStickyMenuCard } = await import('./commands.js');
            
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
                    // Create sticky menu card
                    const { createStickyMenuCard } = await import('./commands.js');
                    createStickyMenuCard(responseData.data);
                    
                    addMessage(`✅ <strong>CHÀO MỪNG ${appUser.fullName || appUser.username}!</strong><br><br>📌 Menu hôm nay đã sẵn sàng ở đầu chat. Click vào món để đặt hàng ngay!`, 'response', true);
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