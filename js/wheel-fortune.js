import { appUser } from './auth.js';
import { sendAddCommand, handleCommand } from './commands.js'; // Added handleCommand, might not be needed if direct fetch is used.
import { addMessage } from './ui-utils.js';
import { CONFIG } from './constants.js'; // For webhook URL

let wheelModal, confirmationModal;
let wheelCanvas, wheelCtx;
let spinButton, closeWheelButton;
let selectedDishName, selectedDishPrice, confirmOrderButton, spinAgainButton, cancelSpinButton;
let currentMenuData = [];
let selectedDish = null;
let isSpinning = false;

// Colors for wheel segments
const wheelColors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', 
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
    '#F8C471', '#82E0AA', '#F1948A', '#85C1E9', '#D2B4DE'
];

export function initializeWheelOfFortune() {
    // Get DOM elements
    wheelModal = document.getElementById('wheelModal');
    confirmationModal = document.getElementById('confirmationModal');
    wheelCanvas = document.getElementById('wheelCanvas');
    spinButton = document.getElementById('spinButton');
    closeWheelButton = document.getElementById('closeWheelButton');
    
    selectedDishName = document.getElementById('selectedDishName');
    selectedDishPrice = document.getElementById('selectedDishPrice');
    confirmOrderButton = document.getElementById('confirmOrderButton');
    spinAgainButton = document.getElementById('spinAgainButton');
    cancelSpinButton = document.getElementById('cancelSpinButton');

    if (wheelCanvas) {
        wheelCtx = wheelCanvas.getContext('2d');
    }

    setupEventListeners();
}

function setupEventListeners() {
    // Random food button click
    const randomFoodButton = document.getElementById('randomFoodButton');
    if (randomFoodButton) {
        randomFoodButton.addEventListener('click', handleRandomFoodClick);
    }

    // Wheel modal events
    if (spinButton) {
        spinButton.addEventListener('click', handleSpin);
    }

    if (closeWheelButton) {
        closeWheelButton.addEventListener('click', closeWheelModal);
    }

    // Confirmation modal events
    if (confirmOrderButton) {
        confirmOrderButton.addEventListener('click', handleConfirmOrder);
    }

    if (spinAgainButton) {
        spinAgainButton.addEventListener('click', handleSpinAgain);
    }

    if (cancelSpinButton) {
        cancelSpinButton.addEventListener('click', () => {
            closeConfirmationModal();
            resetWheel(); // Reset selectedDish when canceling
        });
    }

    // Modal overlay clicks
    wheelModal?.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal-overlay')) {
            closeWheelModal();
        }
    });

    confirmationModal?.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal-overlay')) {
            closeConfirmationModal();
        }
    });
}

function handleRandomFoodClick() {
    // Get current menu data from sticky menu
    const stickyMenuCard = document.querySelector('.sticky-menu-card');
    if (!stickyMenuCard) {
        addMessage('❌ Không có menu khả dụng để quay!', 'error', true);
        return;
    }

    // Extract menu data from sticky menu items
    const menuItems = stickyMenuCard.querySelectorAll('.sticky-menu-item');
    currentMenuData = Array.from(menuItems).map(item => {
        const name = item.querySelector('.sticky-menu-item-name')?.textContent || 'Món ăn';
        const priceText = item.querySelector('.sticky-menu-item-price')?.textContent || '';
        const id = item.dataset.id;
        
        return {
            id: id,
            name: name,
            price: priceText
        };
    });

    if (currentMenuData.length === 0) {
        addMessage('❌ Menu trống, không thể quay!', 'error', true);
        return;
    }

    openWheelModal();
}

function openWheelModal() {
    wheelModal.classList.remove('hidden');
    setTimeout(() => {
        wheelModal.classList.add('show');
        drawWheel();
    }, 10);
}

function closeWheelModal() {
    wheelModal.classList.remove('show');
    setTimeout(() => {
        wheelModal.classList.add('hidden');
        // Only reset wheel visuals, not selectedDish when going to confirmation
        if (wheelCanvas) {
            wheelCanvas.style.transform = 'rotate(0deg)';
        }
        isSpinning = false;
        spinButton.disabled = false;
        if (spinButton?.querySelector('#spinButtonText')) {
            spinButton.querySelector('#spinButtonText').textContent = 'QUAY!';
        }
    }, 300);
}

function openConfirmationModal() {
    confirmationModal.classList.remove('hidden');
    setTimeout(() => {
        confirmationModal.classList.add('show');
    }, 10);
}

function closeConfirmationModal() {
    confirmationModal.classList.remove('show');
    setTimeout(() => {
        confirmationModal.classList.add('hidden');
    }, 300);
}

function drawWheel() {
    if (!wheelCtx || currentMenuData.length === 0) return;

    const centerX = wheelCanvas.width / 2;
    const centerY = wheelCanvas.height / 2;
    const radius = 140;

    // Clear canvas
    wheelCtx.clearRect(0, 0, wheelCanvas.width, wheelCanvas.height);

    const anglePerSlice = (2 * Math.PI) / currentMenuData.length;

    currentMenuData.forEach((item, index) => {
        const startAngle = index * anglePerSlice;
        const endAngle = startAngle + anglePerSlice;

        // Draw slice
        wheelCtx.beginPath();
        wheelCtx.moveTo(centerX, centerY);
        wheelCtx.arc(centerX, centerY, radius, startAngle, endAngle);
        wheelCtx.closePath();

        // Use color from palette, cycling if needed
        wheelCtx.fillStyle = wheelColors[index % wheelColors.length];
        wheelCtx.fill();

        // Draw border
        wheelCtx.strokeStyle = '#fff';
        wheelCtx.lineWidth = 2;
        wheelCtx.stroke();

        // Draw text
        wheelCtx.save();
        wheelCtx.translate(centerX, centerY);
        wheelCtx.rotate(startAngle + anglePerSlice / 2);
        wheelCtx.fillStyle = '#000';
        wheelCtx.font = 'bold 12px Arial';
        wheelCtx.textAlign = 'left';
        wheelCtx.textBaseline = 'middle';

        // Truncate long names
        let displayName = item.name;
        if (displayName.length > 12) {
            displayName = displayName.substring(0, 12) + '...';
        }

        wheelCtx.fillText(displayName, 10, 0);
        wheelCtx.restore();
    });

    // Draw center circle
    wheelCtx.beginPath();
    wheelCtx.arc(centerX, centerY, 30, 0, 2 * Math.PI);
    wheelCtx.fillStyle = '#53d22c';
    wheelCtx.fill();
    wheelCtx.strokeStyle = '#fff';
    wheelCtx.lineWidth = 3;
    wheelCtx.stroke();
}

function handleSpin() {
    console.log('=== handleSpin called ===');
    console.log('currentMenuData:', currentMenuData);
    
    if (isSpinning || currentMenuData.length === 0) {
        console.log('Cannot spin: isSpinning =', isSpinning, 'menuLength =', currentMenuData.length);
        return;
    }

    isSpinning = true;
    spinButton.disabled = true;
    spinButton.querySelector('#spinButtonText').textContent = 'ĐANG QUAY...';

    // Generate random rotation (minimum 5 full rotations + random angle)
    const minRotations = 5;
    const randomRotations = Math.random() * 3; // 0-3 additional rotations
    const randomAngle = Math.random() * 360; // Random final angle
    const totalRotation = (minRotations + randomRotations) * 360 + randomAngle;

    console.log('Spin parameters:', { minRotations, randomRotations, randomAngle, totalRotation });

    // Apply rotation to canvas
    wheelCanvas.style.transform = `rotate(${totalRotation}deg)`;

    // Calculate which slice was selected based on final angle
    setTimeout(() => {
        const normalizedAngle = (360 - (randomAngle % 360)) % 360;
        const anglePerSlice = 360 / currentMenuData.length;
        const selectedIndex = Math.floor(normalizedAngle / anglePerSlice);
        
        console.log('Selection calculation:', { 
            normalizedAngle, 
            anglePerSlice, 
            selectedIndex,
            menuLength: currentMenuData.length 
        });
        
        selectedDish = currentMenuData[selectedIndex];
        
        console.log('Selected dish after calculation:', selectedDish);
        
        // Reset spinning state
        isSpinning = false;
        spinButton.disabled = false;
        spinButton.querySelector('#spinButtonText').textContent = 'QUAY!';

        // Show result
        showSpinResult();
    }, 4000); // Match CSS animation duration
}

function showSpinResult() {
    if (!selectedDish) return;

    // Update confirmation modal with result
    selectedDishName.textContent = selectedDish.name;
    selectedDishPrice.textContent = selectedDish.price || '';

    // Close wheel modal and open confirmation
    closeWheelModal();
    setTimeout(() => {
        openConfirmationModal();
    }, 300);
}

function handleConfirmOrder() {
    console.log('=== handleConfirmOrder called ===');
    console.log('selectedDish:', selectedDish);
    
    if (!selectedDish) {
        console.log('selectedDish is null/undefined');
        return;
    }

    // Add success animation
    confirmOrderButton.classList.add('success-bounce');
    
    // Close modal
    closeConfirmationModal();

    // Send add command
    setTimeout(async () => {
        console.log('About to call sendAddCommand with ID:', selectedDish.id);
        try {
            await sendAddCommand(selectedDish.id);
            console.log('sendAddCommand completed successfully');
            addMessage(`🎰 <strong>QUAY THÀNH CÔNG!</strong><br><br>Đã thêm "${selectedDish.name}" vào đơn hàng từ vòng quay may mắn!`, 'response', true);
        } catch (error) {
            console.log('sendAddCommand error:', error);
            addMessage(`❌ Lỗi khi đặt món: ${error.message}`, 'error', true);
        }
        
        // Remove animation class and reset for next spin
        confirmOrderButton.classList.remove('success-bounce');
        resetWheel(); // Reset selectedDish after successful order
    }, 300);
}

function handleSpinAgain() {
    closeConfirmationModal();
    setTimeout(() => {
        resetWheel();
        openWheelModal();
    }, 300);
}

function resetWheel() {
    if (wheelCanvas) {
        wheelCanvas.style.transform = 'rotate(0deg)';
    }
    selectedDish = null;  // Only reset when truly starting over
    isSpinning = false;
    spinButton.disabled = false;
    if (spinButton?.querySelector('#spinButtonText')) {
        spinButton.querySelector('#spinButtonText').textContent = 'QUAY!';
    }
}

// Function to check if random food button should be visible
export function updateRandomFoodButtonVisibility() {
    const randomFoodButton = document.getElementById('randomFoodButton');
    if (!randomFoodButton) return;

    // Check conditions:
    // 1. User must be authenticated with role 'user' or 'admin' 
    // 2. Must have a menu available (sticky menu card exists and visible)
    const hasValidRole = appUser.isAuthenticated && (appUser.role === 'user' || appUser.role === 'admin');
    const stickyMenuCard = document.querySelector('.sticky-menu-card:not(.hidden)');
    const hasMenu = stickyMenuCard && stickyMenuCard.querySelectorAll('.sticky-menu-item').length > 0;

    if (hasValidRole && hasMenu) {
        randomFoodButton.classList.remove('hidden');
    } else {
        randomFoodButton.classList.add('hidden');
    }
}

export async function openWheelModalWithMenuCheck() {
    if (!appUser.isAuthenticated) {
        // Should not happen if called after auth, but good check
        addMessage("Bạn cần đăng nhập để sử dụng vòng quay.", "error", true);
        return;
    }

    // Display a temporary loading message for fetching menu
    const loadingMessageId = `loading-wheel-menu-${Date.now()}`;
    addMessage("Đang tải menu cho vòng quay...", "info", false, loadingMessageId);

    try {
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

        // Remove loading message
        const loadingElement = document.getElementById(loadingMessageId);
        if (loadingElement) loadingElement.remove();

        const responseData = await response.json();

        if (response.ok && responseData && responseData.errorCode === 0 && responseData.data && Array.isArray(responseData.data) && responseData.data.length > 0) {
            currentMenuData = responseData.data.map(item => ({
                id: item.id, // Assuming menu items have an id
                name: item.name,
                price: item.price ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.price) : ""
            }));

            if (currentMenuData.length > 0) {
                openWheelModal(); // This existing function draws the wheel and shows the modal
            } else {
                addMessage("Không có món nào trong menu để quay vòng may mắn lúc này.", "info", true);
            }
        } else {
            let errorMsg = "Không thể tải menu cho vòng quay. ";
            if (responseData && responseData.message) {
                errorMsg += responseData.message;
            } else if (!response.ok) {
                errorMsg += `(Lỗi: ${response.statusText})`;
            }
            addMessage(errorMsg, "error", true);
        }
    } catch (error) {
        const loadingElement = document.getElementById(loadingMessageId);
        if (loadingElement) loadingElement.remove();
        addMessage(`Lỗi khi tải menu cho vòng quay: ${error.message}`, "error", true);
    }
}

// Ensure openWheelModal is exported if it wasn't (it seems to be implicitly used by openWheelModalWithMenuCheck calling it)
// No explicit export needed if it's only called internally by the exported openWheelModalWithMenuCheck.
// However, if handleRandomFoodClick is to use it too, it might need to be exported or refactored.
// For now, openWheelModal is not exported, which is fine as openWheelModalWithMenuCheck is the public interface.