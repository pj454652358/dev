// 增强的设置页面交互逻辑

// DOM就绪后执行
document.addEventListener("DOMContentLoaded", function() {
    console.log("设置增强脚本已加载");
    initializeSettings();
    setupEventListeners();
});

// 初始化设置页面
function initializeSettings() {
    // 默认展开第一个设置区域
    const firstAccordion = document.querySelector('.accordion-btn');
    if (firstAccordion) {
        const contentId = firstAccordion.getAttribute('onclick').match(/'([^']+)'/)[1];
        toggleSettings(contentId);
    }
}

// 设置各种事件监听器
function setupEventListeners() {
    // 设置保存按钮点击反馈
    const saveBtn = document.getElementById('save-settings');
    if (saveBtn) {
        saveBtn.addEventListener('click', function() {
            // 添加脉冲动画
            this.classList.add('btn-pulse');
            
            // 显示保存成功通知
            setTimeout(() => {
                showNotification('设置已成功保存！');
                this.classList.remove('btn-pulse');
            }, 500);
        });
    }
    
    // 监听新分类输入框，按回车添加
    const newCategoryInput = document.getElementById('new-category');
    if (newCategoryInput) {
        newCategoryInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && this.value.trim() !== '') {
                document.getElementById('add-category-btn').click();
            }
        });
    }
    
    // 监听新选项输入框，按回车添加
    const newFoodInput = document.getElementById('new-food');
    if (newFoodInput) {
        newFoodInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && this.value.trim() !== '') {
                document.getElementById('add-btn').click();
            }
        });
    }
}

// 改进的设置折叠切换函数
function toggleSettings(id) {
    console.log(`切换设置区域: ${id}`);
    
    const content = document.getElementById(id);
    const button = document.querySelector(`button[onclick="toggleSettings('${id}')"]`);
    
    if (!content) {
        console.error(`找不到元素: #${id}`);
        return;
    }
    
    // 切换当前折叠区域
    if (content.style.display === "none" || content.style.display === "") {
        // 展开内容
        content.style.display = "block";
        content.style.opacity = 0;
        content.style.maxHeight = 0;
        
        // 添加动画效果
        setTimeout(() => {
            content.style.opacity = 1;
            content.style.maxHeight = content.scrollHeight + "px";
        }, 10);
        
        if (button) button.classList.add("active");
    } else {
        // 折叠内容
        content.style.opacity = 0;
        content.style.maxHeight = 0;
        
        // 延迟隐藏，以便动画完成
        setTimeout(() => {
            content.style.display = "none";
        }, 300);
        
        if (button) button.classList.remove("active");
    }
}

// 通知提示函数
function showNotification(message, isError = false) {
    // 移除旧的通知
    const oldNotification = document.querySelector('.notification');
    if (oldNotification) {
        oldNotification.remove();
    }
    
    // 创建新通知
    const notification = document.createElement('div');
    notification.className = `notification ${isError ? 'error' : ''}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // 显示通知
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // 自动隐藏通知
    setTimeout(() => {
        notification.classList.remove('show');
        
        // 移除元素
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// 分类项目渲染增强
function renderCategory(category) {
    const categoryEl = document.createElement('div');
    categoryEl.className = 'category-item';
    categoryEl.dataset.id = category.id;
    
    // 生成随机颜色或使用指定颜色
    const color = category.color || getRandomColor();
    
    categoryEl.innerHTML = `
        <div class="category-info">
            <span class="category-color" style="background-color: ${color}"></span>
            <span class="category-name">${category.name}</span>
        </div>
        <div class="category-actions">
            <button type="button" class="edit-category" title="编辑分类">
                <i class="fas fa-pencil-alt"></i>
            </button>
            <button type="button" class="delete-category" title="删除分类">
                <i class="fas fa-trash-alt"></i>
            </button>
        </div>
    `;
    
    return categoryEl;
}

// 食物项目渲染增强
function renderFoodItem(food) {
    const foodEl = document.createElement('div');
    foodEl.className = `food-item ${food.isFavorite ? 'favorite-item' : ''}`;
    foodEl.dataset.id = food.id;
    
    // 生成分类标签
    const categoryTag = food.category ? 
        `<span class="food-category-tag">${food.category.name}</span>` : '';
    
    foodEl.innerHTML = `
        <div class="food-name">
            ${food.name} ${categoryTag}
        </div>
        <div class="food-actions">
            <button type="button" class="edit-btn" title="编辑选项">
                <i class="fas fa-cog"></i>
            </button>
            <button type="button" class="delete-btn" title="删除选项">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    return foodEl;
}

// 获取随机颜色
function getRandomColor() {
    const colors = [
        '#f39c12', '#e67e22', '#e74c3c', '#9b59b6', '#2980b9', '#16a085',
        '#27ae60', '#2ecc71', '#1abc9c', '#3498db', '#8e44ad', '#d35400'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
}
