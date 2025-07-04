// 扁平化UI专用JavaScript

// DOM就绪后执行
document.addEventListener("DOMContentLoaded", function() {
    console.log("扁平化UI脚本已加载");
    initializeFlatUI();
});

// 初始化扁平化UI
function initializeFlatUI() {
    // 确保所有按钮都有正确的扁平化类
    addFlatClasses();
    
    // 初始化通知系统
    initializeNotifications();
    
    // 初始化模态框
    initializeModals();
}

// 添加扁平化CSS类
function addFlatClasses() {
    // 为所有主要按钮添加扁平化类
    const primaryButtons = document.querySelectorAll('#save-settings, #add-btn, #add-category-btn');
    primaryButtons.forEach(btn => {
        if (btn && !btn.classList.contains('btn')) {
            btn.classList.add('btn', 'btn-primary');
        }
    });
    
    // 为次要按钮添加扁平化类
    const secondaryButtons = document.querySelectorAll('#reset-default, #reset-categories, #clear-history');
    secondaryButtons.forEach(btn => {
        if (btn && !btn.classList.contains('btn')) {
            btn.classList.add('btn', 'btn-secondary');
        }
    });
    
    // 为危险按钮添加扁平化类
    const dangerButtons = document.querySelectorAll('.delete-btn');
    dangerButtons.forEach(btn => {
        if (btn && !btn.classList.contains('btn')) {
            btn.classList.add('btn', 'btn-danger');
        }
    });
}

// 初始化通知系统
function initializeNotifications() {
    // 移除旧的通知样式，使用扁平化通知
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(n => n.remove());
}

// 初始化模态框
function initializeModals() {
    const modal = document.getElementById('advanced-settings-modal');
    if (modal) {
        // 确保模态框内容有正确的结构
        const modalContent = modal.querySelector('.modal-content');
        if (modalContent && !modalContent.querySelector('.modal-header')) {
            // 重构模态框为扁平化结构
            const title = modalContent.querySelector('h3');
            const closeBtn = modalContent.querySelector('.close');
            const content = modalContent.querySelector('#food-advanced-settings');
            
            if (title && content) {
                // 创建模态框头部
                const header = document.createElement('div');
                header.className = 'modal-header';
                header.appendChild(title);
                if (closeBtn) header.appendChild(closeBtn);
                
                // 创建模态框主体
                const body = document.createElement('div');
                body.className = 'modal-body';
                body.appendChild(content);
                
                // 清空并重新组织
                modalContent.innerHTML = '';
                modalContent.appendChild(header);
                modalContent.appendChild(body);
            }
        }
    }
}

// 更新权重显示
function updateWeightDisplay() {
    const weightSlider = document.getElementById('food-weight');
    const weightOutput = weightSlider?.nextElementSibling;
    const weightValue = document.querySelector('.weight-value strong');
    
    if (weightSlider && weightOutput && weightValue) {
        weightSlider.addEventListener('input', function() {
            const value = this.value;
            weightOutput.textContent = value;
            weightValue.textContent = value;
        });
    }
}

// 初始化高级设置UI增强
function initializeAdvancedSettingsUI() {
    updateWeightDisplay();
    
    // 自定义复选框交互
    const favoriteCheckbox = document.getElementById('food-favorite');
    const checkboxLabel = document.querySelector('.checkbox-label');
    
    if (favoriteCheckbox && checkboxLabel) {
        checkboxLabel.addEventListener('click', function(e) {
            if (e.target !== favoriteCheckbox) {
                favoriteCheckbox.checked = !favoriteCheckbox.checked;
                favoriteCheckbox.dispatchEvent(new Event('change'));
            }
        });
    }
}

// 扁平化通知函数
function showFlatNotification(message, type = 'success') {
    // 移除旧通知
    const oldNotification = document.querySelector('.notification');
    if (oldNotification) {
        oldNotification.remove();
    }
    
    // 创建新通知
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `<i class="fas fa-${getNotificationIcon(type)}"></i> ${message}`;
    
    document.body.appendChild(notification);
    
    // 显示通知
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // 自动隐藏
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// 获取通知图标
function getNotificationIcon(type) {
    switch(type) {
        case 'success': return 'check-circle';
        case 'error': return 'exclamation-circle';
        case 'warning': return 'exclamation-triangle';
        default: return 'info-circle';
    }
}

// 扁平化模态框显示
function showFlatModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }
}

// 扁平化模态框隐藏
function hideFlatModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

// 导出通知函数供其他脚本使用
window.showNotification = showFlatNotification;
window.showModal = showFlatModal;
window.hideModal = hideFlatModal;

// 在DOM加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    initializeAdvancedSettingsUI();
});
