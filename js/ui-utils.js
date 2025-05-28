import { appUser } from './auth.js';

// UI Utility functions
export function addMessage(text, type = 'command', isHtml = false) {
    const messageContainer = document.getElementById('messageContainer');
    const messageElement = document.createElement('div');
    messageElement.classList.add('bg-[#1A1F18]', 'p-3', 'rounded-lg', 'shadow-md', 'mb-2', 'break-words');
    
    if (type === 'command') {
        messageElement.classList.add('ml-auto', 'bg-[#2D372A]', 'max-w-[70%]');
        const codeElement = document.createElement('code');
        codeElement.classList.add('text-[#A5B6A0]', 'text-sm', 'whitespace-pre-wrap');
        codeElement.textContent = text;
        messageElement.appendChild(codeElement);
    } else if (type === 'response' || type === 'menu_item' || type === 'webhook_response') {
        messageElement.classList.add('mr-auto', 'bg-[#1A1F18]', 'max-w-[70%]');
         if (type === 'webhook_response') { 
            messageElement.classList.add('border', 'border-blue-500/30');
        }
        const pElement = document.createElement('p');
        pElement.classList.add('text-[#A5B6A0]', 'text-sm', 'whitespace-pre-wrap');
        if (isHtml) {
            pElement.innerHTML = text;
        } else {
            pElement.textContent = text;
        }
        messageElement.appendChild(pElement);
    } else if (type === 'error') {
        messageElement.classList.add('mr-auto', 'bg-red-700/30', 'max-w-[70%]');
        const pElement = document.createElement('p');
        pElement.classList.add('text-red-300', 'text-sm', 'whitespace-pre-wrap');
        pElement.textContent = text;
        messageElement.appendChild(pElement);
    }

    const welcomeMessage = messageContainer.querySelector('#initialWelcomeMessage');
    if (welcomeMessage && appUser.isAuthenticated) { 
         welcomeMessage.remove();
    } else if (welcomeMessage && !appUser.isAuthenticated && messageContainer.children.length > 1 && type !== 'command') {
         if (messageContainer.querySelectorAll('div:not(#initialWelcomeMessage)').length > 0) {
            welcomeMessage.remove();
         }
    }
    
    messageContainer.appendChild(messageElement);
    messageContainer.scrollTop = messageContainer.scrollHeight;
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
    const bodyStyles = window.getComputedStyle(document.body);
    const footerElement = document.querySelector('footer.fixed');
    
    if (bodyStyles.maxWidth !== 'none' && bodyStyles.maxWidth !== '100%') {
        footerElement.style.maxWidth = bodyStyles.maxWidth;
        if (bodyStyles.marginLeft === 'auto' && bodyStyles.marginRight === 'auto') {
            footerElement.style.left = '50%';
            footerElement.style.transform = 'translateX(-50%)';
        } else {
            footerElement.style.left = bodyStyles.marginLeft;
            footerElement.style.transform = 'none';
        }
    } else { 
        footerElement.style.maxWidth = '100%';
        footerElement.style.left = '0';
        footerElement.style.transform = 'none';
    }
} 