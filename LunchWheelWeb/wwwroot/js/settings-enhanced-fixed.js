// 设置增强脚本 - 修复版

// 防止重复初始化
if (typeof window.settingsEnhancedLoaded === 'undefined') {
    window.settingsEnhancedLoaded = true;

    // DOM就绪后执行
    document.addEventListener("DOMContentLoaded", function() {
        console.log("设置增强脚本已加载");
        initializeEnhancements();
    });

    // 初始化增强功能
    function initializeEnhancements() {
        enhanceFormElements();
        addKeyboardShortcuts();
        improveUserFeedback();
    }

    // 增强表单元素
    function enhanceFormElements() {
        // 为所有输入框添加焦点效果
        const inputs = document.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            input.addEventListener('focus', function() {
                const parent = this.closest('.form-group, .setting-group');
                if (parent) parent.classList.add('focused');
            });
            
            input.addEventListener('blur', function() {
                const parent = this.closest('.form-group, .setting-group');
                if (parent) parent.classList.remove('focused');
            });
        });

        // 为按钮添加点击反馈
        const buttons = document.querySelectorAll('button:not(.accordion-btn)');
        buttons.forEach(button => {
            button.addEventListener('click', function() {
                this.classList.add('clicked');
                setTimeout(() => {
                    this.classList.remove('clicked');
                }, 150);
            });
        });
    }

    // 添加键盘快捷键
    function addKeyboardShortcuts() {
        document.addEventListener('keydown', function(e) {
            // Ctrl+S 保存设置
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                const saveBtn = document.getElementById('save-settings');
                if (saveBtn && document.getElementById('settings-tab').classList.contains('active')) {
                    saveBtn.click();
                    showEnhancedNotification('快捷键保存！', 'success');
                }
            }
            
            // Escape 关闭模态框
            if (e.key === 'Escape') {
                const modal = document.querySelector('.modal[style*="display: block"]');
                if (modal) {
                    modal.style.display = 'none';
                    document.body.style.overflow = 'auto';
                }
            }
        });
    }

    // 改进用户反馈
    function improveUserFeedback() {
        // 监听保存按钮
        const saveBtn = document.getElementById('save-settings');
        if (saveBtn) {
            saveBtn.addEventListener('click', function() {
                const originalContent = this.innerHTML;
                this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 保存中...';
                this.disabled = true;
                
                setTimeout(() => {
                    this.innerHTML = '<i class="fas fa-check"></i> 保存成功';
                    setTimeout(() => {
                        this.innerHTML = originalContent;
                        this.disabled = false;
                    }, 1000);
                }, 800);
            });
        }

        // 监听重置按钮
        const resetBtn = document.getElementById('reset-default');
        if (resetBtn) {
            resetBtn.addEventListener('click', function(e) {
                if (!confirm('确定要恢复默认设置吗？这将清除所有自定义选项。')) {
                    e.preventDefault();
                    e.stopPropagation();
                    return false;
                }
                
                const originalContent = this.innerHTML;
                this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 重置中...';
                this.disabled = true;
                
                setTimeout(() => {
                    this.innerHTML = '<i class="fas fa-check"></i> 重置完成';
                    setTimeout(() => {
                        this.innerHTML = originalContent;
                        this.disabled = false;
                    }, 1000);
                }, 800);
            });
        }
    }

    // 增强版通知函数
    function showEnhancedNotification(message, type = 'success', duration = 3000) {
        // 移除旧通知
        const oldNotification = document.querySelector('.enhanced-notification');
        if (oldNotification) {
            oldNotification.remove();
        }

        // 创建新通知
        const notification = document.createElement('div');
        notification.className = `enhanced-notification ${type}`;
        
        const icon = getNotificationIcon(type);
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${icon}"></i>
                <span>${message}</span>
            </div>
            <button class="notification-close">×</button>
        `;

        // 添加样式
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${getNotificationColor(type)};
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            z-index: 1001;
            transform: translateX(100%);
            transition: transform 0.3s ease;
            display: flex;
            align-items: center;
            gap: 10px;
            max-width: 350px;
        `;

        document.body.appendChild(notification);

        // 显示动画
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 10);

        // 关闭按钮事件
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => {
            hideNotification(notification);
        });

        // 自动隐藏
        setTimeout(() => {
            hideNotification(notification);
        }, duration);
    }

    // 隐藏通知
    function hideNotification(notification) {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }

    // 获取通知图标
    function getNotificationIcon(type) {
        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };
        return icons[type] || 'info-circle';
    }

    // 获取通知颜色
    function getNotificationColor(type) {
        const colors = {
            success: '#27ae60',
            error: '#e74c3c',
            warning: '#f39c12',
            info: '#3498db'
        };
        return colors[type] || '#3498db';
    }

    // 导出函数供其他脚本使用
    window.showEnhancedNotification = showEnhancedNotification;
}
