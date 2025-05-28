import { loadAuthFromLocalStorage, updateAuthStatusUI } from "./auth.js";
import { initializeCommandElements, populateCommandList, setupCommandListeners, updateCommandHelpText, handleCommand } from "./commands.js";
import { initializeModalElements, setupModalEventListeners } from "./modals.js";
import { alignFooterToBody } from "./ui-utils.js";

// Main application initialization
function initializeApp() {
    // Initialize all modules
    initializeModalElements();
    initializeCommandElements();
    
    // Setup event listeners
    setupModalEventListeners();
    setupCommandListeners();
    setupMainCommandInput();
    
    // Load auth state and update UI
    loadAuthFromLocalStorage();
    updateAuthStatusUI();
    updateCommandHelpText();
    populateCommandList();
    
    // Setup footer alignment
    setupFooterAlignment();
}

function setupMainCommandInput() {
    const commandInput = document.getElementById('commandInput');
    const sendCommandButton = document.getElementById('sendCommandButton');
    
    sendCommandButton.addEventListener('click', () => {
        const command = commandInput.value.trim();
        if (command) {
            handleCommand(command);
            commandInput.value = '';
        }
    });

    commandInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter') {
            event.preventDefault();
            sendCommandButton.click();
        }
    });
}

function setupFooterAlignment() {
    window.addEventListener('resize', alignFooterToBody);
    window.addEventListener('load', alignFooterToBody); 
    alignFooterToBody();
}

// Initialize app when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
} else {
    initializeApp();
} 