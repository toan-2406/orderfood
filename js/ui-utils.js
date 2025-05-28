import { appUser } from './auth.js';

// Helper function to escape HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Helper function to format message text
function formatMessageText(text) {
    // Convert newlines to <br> tags
    return text.replace(/\n/g, '<br>');
}

// UI Utility functions
export function addMessage(text, type = 'system', allowHTML = false) {
    const messageContainer = document.getElementById('messageContainer');
    const mainChatArea = document.getElementById('mainChatArea');
    
    // Remove welcome message if user is authenticated
    const welcomeMessage = messageContainer.querySelector('#initialWelcomeMessage');
    if (welcomeMessage && (appUser.isAuthenticated || messageContainer.children.length > 1)) { 
         welcomeMessage.remove();
    }
    
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('mb-2');
    
    let bgColor, textColor, alignment;
    
    switch (type) {
        case 'command':
            bgColor = 'bg-[#53d22c]';
            textColor = 'text-black';
            alignment = 'ml-auto max-w-[70%]';
            break;
        case 'response':
        case 'webhook_response':
        case 'menu_item':
            bgColor = 'bg-[#1A1F18]';
            textColor = 'text-[#A5B6A0]';
            alignment = 'mr-auto max-w-[70%]';
            break;
        case 'error':
            bgColor = 'bg-red-900/30';
            textColor = 'text-red-300';
            alignment = 'mr-auto max-w-[70%]';
            break;
        default:
            bgColor = 'bg-[#1A1F18]';
            textColor = 'text-[#A5B6A0]';
            alignment = 'mr-auto max-w-[70%]';
    }
    
    messageDiv.className = `${bgColor} ${textColor} p-3 rounded-lg shadow-md mb-2 ${alignment}`;
    
    const contentHTML = allowHTML ? text : escapeHtml(text);
    const formattedHTML = formatMessageText(contentHTML);
    messageDiv.innerHTML = `<p class="text-sm">${formattedHTML}</p>`;
    
    messageContainer.appendChild(messageDiv);
    
    // Auto scroll to latest message in main chat area
    setTimeout(() => {
        mainChatArea.scrollTo({
            top: mainChatArea.scrollHeight,
            behavior: 'smooth'
        });
    }, 100);
}

// Generic Modal Opener/Closer
export function openModal(modalElement, firstInputElement = null) {
    modalElement.classList.remove('hidden');
    const modalContentElement = modalElement.querySelector('.modal-content');
    setTimeout(() => {
        modalContentElement.classList.remove('scale-95', 'opacity-0');
        modalContentElement.classList.add('scale-100', 'opacity-100');
        if (firstInputElement) {
            firstInputElement.focus();
        }
    }, 10);
}

export function closeModal(modalElement) {
    const modalContentElement = modalElement.querySelector('.modal-content');
    modalContentElement.classList.remove('scale-100', 'opacity-100');
    modalContentElement.classList.add('scale-95', 'opacity-0');
    setTimeout(() => {
        modalElement.classList.add('hidden');
         const commandInput = document.getElementById('commandInput');
         commandInput.focus(); // Focus main command input after closing any modal
    }, 300);
}

// Submit on Enter for Modals
export function setupModalSubmitOnEnter(modalInputFields, confirmButton) {
    modalInputFields.forEach(inputField => {
        inputField.addEventListener('keypress', (event) => {
            if (event.key === 'Enter') {
                event.preventDefault();
                confirmButton.click();
            }
        });
    });
}

export function alignFooterToBody() {
    // Footer is no longer fixed positioned, so no alignment needed
    // This function is kept for backward compatibility but does nothing now
    return;
} 