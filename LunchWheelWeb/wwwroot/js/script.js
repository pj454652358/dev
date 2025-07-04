// 颜色列表
const colors = [
    '#f39c12', '#e67e22', '#e74c3c', '#9b59b6', '#2980b9', '#16a085',
    '#27ae60', '#2ecc71', '#1abc9c', '#3498db', '#8e44ad', '#d35400'
];

// 主要 DOM 元素
const wheel = document.getElementById('wheel');
const ctx = wheel.getContext('2d');
const spinBtn = document.getElementById('spin');
const resultDiv = document.getElementById('result');
const spinSound = document.getElementById('spin-sound');
const resultSound = document.getElementById('result-sound');

// 全局变量
let foods = []; // 存储所有食物数据
let foodsData = []; // 存储详细食物数据
let categoryData = []; // 存储分类数据
let filteredFoods = []; // 当前过滤后的食物列表
let currentCategoryId = null; // 当前选中的分类ID
let angle = 0;
let spinning = false;
let wheelRadius;
let lastResult = null;
let history = initialHistory || [];
let settings = initialSettings || {
    title: "决策转盘",
    itemName: "选项",
    theme: "default"
};

// 服务器API
class ServerApi {
    // 获取所有食物
    static async getFoods(categoryId = null) {
        try {
            const url = categoryId 
                ? `/api/LunchWheel/foods?categoryId=${categoryId}` 
                : '/api/LunchWheel/foods';
            const response = await fetch(url);
            return await response.json();
        } catch (error) {
            console.error('获取食物列表失败:', error);
            return [];
        }
    }
    
    // 获取详细食物数据（包含权重、分类等信息）
    static async getFoodsDetails(categoryId = null) {
        try {
            const url = categoryId 
                ? `/api/LunchWheel/foods/details?categoryId=${categoryId}` 
                : '/api/LunchWheel/foods/details';
            const response = await fetch(url);
            return await response.json();
        } catch (error) {
            console.error('获取食物详情失败:', error);
            return [];
        }
    }
    
    // 获取分类列表
    static async getCategories() {
        try {
            const response = await fetch('/api/LunchWheel/categories');
            return await response.json();
        } catch (error) {
            console.error('获取分类列表失败:', error);
            return [];
        }
    }
    
    // 添加分类
    static async addCategory(category) {
        try {
            const response = await fetch('/api/LunchWheel/categories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(category)
            });
            return await response.json();
        } catch (error) {
            console.error('添加分类失败:', error);
            return { success: false, message: '添加分类失败' };
        }
    }
    
    // 删除分类
    static async deleteCategory(id) {
        try {
            const response = await fetch(`/api/LunchWheel/categories/${id}`, {
                method: 'DELETE'
            });
            return await response.json();
        } catch (error) {
            console.error('删除分类失败:', error);
            return { success: false, message: '删除分类失败' };
        }
    }
    
    // 重置默认分类
    static async resetCategories() {
        try {
            const response = await fetch('/api/LunchWheel/categories/reset', {
                method: 'POST'
            });
            return await response.json();
        } catch (error) {
            console.error('重置分类失败:', error);
            return [];
        }
    }
    
    // 保存食物列表
    static async saveFoods(foods) {
        try {
            const response = await fetch('/api/LunchWheel/foods/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(foods)
            });
            return await response.json();
        } catch (error) {
            console.error('保存食物列表失败:', error);
            return { success: false, message: '保存失败' };
        }
    }
    
    // 重置为默认食物
    static async resetFoods() {
        try {
            const response = await fetch('/api/LunchWheel/foods/reset', {
                method: 'POST'
            });
            return await response.json();
        } catch (error) {
            console.error('重置食物失败:', error);
            return [];
        }
    }
    
    // 随机选择食物
    static async spinWheel(lastSelected = null, categoryId = null) {
        try {
            let url = '/api/LunchWheel/spin';
            const params = new URLSearchParams();
            
            if (categoryId) {
                params.append('categoryId', categoryId);
            }
            
            if (lastSelected) {
                params.append('lastSelected', lastSelected);
            }
            
            if (params.toString()) {
                url += '?' + params.toString();
            }
            
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error('转盘API请求失败');
            }
            return await response.json();
        } catch (error) {
            console.error('转盘操作失败:', error);
            return null;
        }
    }
    
    // 添加历史记录
    static async addHistory(food, categoryName = null, categoryColor = null) {
        try {
            const response = await fetch('/api/LunchWheel/history', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    food, 
                    categoryName,
                    categoryColor,
                    time: new Date() 
                })
            });
            return response.ok;
        } catch (error) {
            console.error('添加历史记录失败:', error);
            return false;
        }
    }
    
    // 获取历史记录
    static async getHistory() {
        try {
            const response = await fetch('/api/LunchWheel/history');
            return await response.json();
        } catch (error) {
            console.error('获取历史记录失败:', error);
            return [];
        }
    }
    
    // 清空历史记录
    static async clearHistory() {
        try {
            const response = await fetch('/api/LunchWheel/history', {
                method: 'DELETE'
            });
            return response.ok;
        } catch (error) {
            console.error('清空历史记录失败:', error);
            return false;
        }
    }
    
    // 获取设置
    static async getSettings() {
        try {
            const response = await fetch('/api/LunchWheel/settings');
            return await response.json();
        } catch (error) {
            console.error('获取设置失败:', error);
            return null;
        }
    }
    
    // 更新设置
    static async updateSettings(settings) {
        try {
            const response = await fetch('/api/LunchWheel/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings)
            });
            return await response.json();
        } catch (error) {
            console.error('更新设置失败:', error);
            return null;
        }
    }
    
    // 重置设置
    static async resetSettings() {
        try {
            const response = await fetch('/api/LunchWheel/settings/reset', {
                method: 'POST'
            });
            return await response.json();
        } catch (error) {
            console.error('重置设置失败:', error);
            return null;
        }
    }
    
    // 设置食物权重
    static async setFoodWeight(id, weight) {
        try {
            const response = await fetch(`/api/LunchWheel/foods/${id}/weight`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(weight)
            });
            return await response.json();
        } catch (error) {
            console.error('设置权重失败:', error);
            return { success: false, message: '设置权重失败' };
        }
    }
    
    // 设置食物喜爱标记
    static async setFoodFavorite(id, isFavorite) {
        try {
            const response = await fetch(`/api/LunchWheel/foods/${id}/favorite`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(isFavorite)
            });
            return await response.json();
        } catch (error) {
            console.error('设置喜爱标记失败:', error);
            return { success: false, message: '设置喜爱标记失败' };
        }
    }
    
    // 设置食物可用时间
    static async setFoodAvailableTime(id, fromTime, toTime) {
        try {
            const response = await fetch(`/api/LunchWheel/foods/${id}/availableTime`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fromTime, toTime })
            });
            return await response.json();
        } catch (error) {
            console.error('设置可用时间失败:', error);
            return { success: false, message: '设置可用时间失败' };
        }
    }
    
    // 设置食物排除小时数
    static async setFoodExclusionHours(id, hours) {
        try {
            const response = await fetch(`/api/LunchWheel/foods/${id}/exclusionHours`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(hours)
            });
            return await response.json();
        } catch (error) {
            console.error('设置排除规则失败:', error);
            return { success: false, message: '设置排除规则失败' };
        }
    }
}

// 食物转盘类
class FoodWheel {
    constructor(canvas, foods) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.foods = foods.map(f => f.name || f); // 支持传入对象或字符串
        this.spinning = false;
        this.lastIdx = null;
        
        // 初始化角度，让指针指向第一个食物选项的中间
        this.initializeAngle();
        
        // 自动设置尺寸
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }
    
    // 更新食物列表
    updateFoods(foods) {
        this.foods = foods.map(f => f.name || f);
        this.initializeAngle();
        this.draw();
    }
    
    // 初始化角度，让指针指向一个食物选项的中间
    initializeAngle() {
        if (this.foods.length === 0) {
            this.angle = 0;
            return;
        }
        
        // 可以选择固定指向第一个食物或随机选择一个食物
        const initialFoodIdx = Math.floor(Math.random() * this.foods.length); // 随机选择一个食物
        
        // 计算扇区角度
        const sectorAngle = 360 / this.foods.length;
        
        // 计算转盘需要旋转的角度，使指针（270度位置）指向选中的食物中心
        // Canvas中0度是在3点钟方向，顺时针旋转
        // 因为指针在270度（12点钟方向），需要计算使食物中心与指针对齐的转盘角度
        
        // 计算方法：将食物中心旋转到270度位置
        // 食物中心位置 = (initialFoodIdx * sectorAngle + sectorAngle/2)
        // 需要旋转的角度 = 270 - 食物中心位置
        this.angle = 270 - (initialFoodIdx * sectorAngle + sectorAngle/2);
    }
    
    // 调整转盘尺寸
    resize() {
        const container = this.canvas.parentElement;
        const size = Math.min(container.clientWidth, 400);
        this.canvas.width = this.canvas.height = size;
        this.radius = size / 2;
        this.draw();
    }
    
    // 绘制转盘
    draw() {
        if (this.foods.length === 0) return;
        
        const ctx = this.ctx;
        const radius = this.radius;
        const arc = 2 * Math.PI / this.foods.length;
        
        ctx.save();
        ctx.translate(radius, radius);
        ctx.rotate((this.angle % 360) * Math.PI / 180);
        ctx.translate(-radius, -radius);
        
        for (let i = 0; i < this.foods.length; i++) {
            ctx.beginPath();
            ctx.moveTo(radius, radius);
            ctx.arc(radius, radius, radius, i * arc, (i + 1) * arc);
            ctx.closePath();
            ctx.fillStyle = colors[i % colors.length];
            ctx.fill();
            
            // 绘制文字
            ctx.save();
            ctx.translate(radius, radius);
            ctx.rotate((i + 0.5) * arc);
            ctx.textAlign = 'right';
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 16px sans-serif';
            
            // 处理长文本
            const text = this.foods[i];
            const maxLength = Math.floor(radius * 0.7);
            let fontSize = Math.min(16, radius * 0.08);
            ctx.font = `bold ${fontSize}px sans-serif`;
            
            // 缩放文本以适应扇形
            if (ctx.measureText(text).width > maxLength) {
                const scale = maxLength / ctx.measureText(text).width;
                fontSize *= scale;
                ctx.font = `bold ${fontSize}px sans-serif`;
            }
            
            ctx.fillText(text, radius - radius * 0.1, 5);
            ctx.restore();
        }
        ctx.restore();
    }
    
    // 旋转动画
    async spin(callback) {
        if (this.spinning) return;
        if (this.foods.length === 0) {
            alert('请先添加选项');
            return;
        }
        
        this.spinning = true;
        
        // 声明变量，确保它们在整个方法范围内可用
        let targetFood;
        let targetIdx;
        
        // 尝试播放音效文件，如果失败则使用生成的音效
        try {
            spinSound.currentTime = 0;
            const playPromise = spinSound.play();
            
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.warn('音频文件播放失败，使用生成的音效代替', error);
                    soundGenerator.generateSpinSound();
                });
            }
        } catch(e) {
            soundGenerator.generateSpinSound();
        }
        
        // 使用后端API获取随机食物
        // 如果有上次选择的食物，传递给API避免连续选择
        const lastSelectedFood = this.lastIdx !== null ? this.foods[this.lastIdx] : null;
        
        try {
            // 从localStorage获取保存的分类ID
            const savedCategoryId = localStorage.getItem('selectedCategoryId');
            
            // 获取后端返回的随机食物，使用保存的分类ID
            const result = await ServerApi.spinWheel(lastSelectedFood, savedCategoryId || null);
            
            if (!result) {
                this.spinning = false;
                return;
            }
            
            // 如果有消息需要显示
            if (result.message) {
                showMessage(result.message, 'info');
            }
            
            // 获取目标食物及其索引
            targetFood = result.food;
            targetIdx = this.foods.indexOf(targetFood);
            
            // 如果食物不在列表中（不太可能发生，除非前后端不同步）
            if (targetIdx === -1) {
                console.error('返回的食物不在列表中:', targetFood);
                this.spinning = false;
                return;
            }
            
            // 更新最后选择的索引
            this.lastIdx = targetIdx;
        } catch (error) {
            console.error('获取随机食物失败:', error);
            this.spinning = false;
            return;
        }
        
        // 计算指向目标食物中心的角度
        const sectorAngle = 360 / this.foods.length;
        const targetAngle = 270 - (targetIdx * sectorAngle + sectorAngle / 2);
        
        // 计算旋转量，确保转够几圈后指向目标
        let start = this.angle % 360;
        let target = Math.floor(this.angle / 360) * 360 + targetAngle + 360;
        
        if (target - start < 360 * 3) {
            target += 360 * 3;
        }
        
        const duration = 3000; // 动画持续时间
        const startTime = Date.now();
        
        const easeOutQuart = t => 1 - Math.pow(1 - t, 4);
        
        const animate = () => {
            const now = Date.now();
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            this.angle = start + (target - start) * easeOutQuart(progress);
            this.draw();
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                // 动画完成
                this.spinning = false;
                
                // 尝试播放结果音效
                try {
                    resultSound.currentTime = 0;
                    const playPromise = resultSound.play();
                    
                    if (playPromise !== undefined) {
                        playPromise.catch(error => {
                            console.warn('音频文件播放失败，使用生成的音效代替', error);
                            soundGenerator.generateResultSound();
                        });
                    }
                } catch(e) {
                    soundGenerator.generateResultSound();
                }
                
                if (callback) callback(targetFood);
            }
        };
        
        animate();
    }
}

// UI管理类
class UIManager {
    constructor(foodWheel) {
        this.foodWheel = foodWheel;
        this.setupDOMElements();
        this.setupEventListeners();
        this.setupMessageSystem();
        this.reloadData();
    }
    
    // 设置DOM元素
    setupDOMElements() {
        // 标签切换
        this.tabBtns = document.querySelectorAll('.tab-btn');
        this.tabContents = document.querySelectorAll('.tab-content');
        
        // 设置区域 (新版本)
        this.wheelNameInput = document.getElementById('wheel-name');
        this.itemNameInput = document.getElementById('item-name');
        this.itemTypeTexts = document.querySelectorAll('.item-type-text');
        
        // 食物列表
        this.foodsContainer = document.getElementById('foods-container');
        this.newFoodInput = document.getElementById('new-food');
        this.addFoodButton = document.getElementById('add-btn');
        this.resetDefaultButton = document.getElementById('reset-default');
        this.saveSettingsButton = document.getElementById('save-settings');
        this.customOptionsTitle = document.getElementById('custom-options-title');
        
        // 历史记录
        this.historyList = document.getElementById('history-list');
        this.clearHistoryButton = document.getElementById('clear-history');
        
        // 分类相关
        this.categoryButtons = document.getElementById('category-buttons');
        this.categoriesList = document.getElementById('categories-list');
        this.newCategoryInput = document.getElementById('new-category');
        this.addCategoryButton = document.getElementById('add-category-btn');
        this.resetCategoriesButton = document.getElementById('reset-categories');
        this.filterCategorySelect = document.getElementById('filter-category');
        this.newFoodCategorySelect = document.getElementById('new-food-category');
        
        // 高级设置模态框
        this.advancedSettingsModal = document.getElementById('advanced-settings-modal');
        this.closeBtns = document.querySelectorAll('.close, .close-modal');
        this.editingFoodName = document.getElementById('editing-food-name');
        this.foodWeightInput = document.getElementById('food-weight');
        this.foodFavoriteCheck = document.getElementById('food-favorite');
        this.foodCategorySelect = document.getElementById('food-category');
        this.availableFromTime = document.getElementById('available-from-time');
        this.availableToTime = document.getElementById('available-to-time');
        this.exclusionHoursInput = document.getElementById('exclusion-hours');
        this.saveAdvancedSettings = document.getElementById('save-advanced-settings');
    }
    
    // 设置事件监听
    setupEventListeners() {
        // 标签切换
        this.tabBtns.forEach(btn => {
            btn.addEventListener('click', () => this.switchTab(btn.dataset.tab));
        });
        
        // 折叠/展开功能已移至settings.js中处理
        
        // 设置输入框变化
        if (this.wheelNameInput) {
            this.wheelNameInput.addEventListener('input', () => this.updateTitle());
            this.wheelNameInput.value = settings.title || '决策转盘';
        }
        
        if (this.itemNameInput) {
            this.itemNameInput.addEventListener('input', () => this.updateItemName());
            this.itemNameInput.value = settings.itemName || '选项';
        }
        
        // 食物列表操作
        if (this.addFoodButton) {
            this.addFoodButton.addEventListener('click', () => this.addFood());
        }
        
        if (this.newFoodInput) {
            this.newFoodInput.addEventListener('keypress', e => {
                if (e.key === 'Enter') this.addFood();
            });
        }
        
        // 重置默认
        if (this.resetDefaultButton) {
            this.resetDefaultButton.addEventListener('click', () => this.resetToDefaults());
        }
        
        // 保存设置
        if (this.saveSettingsButton) {
            this.saveSettingsButton.addEventListener('click', () => this.saveSettings());
        }
        
        // 清空历史
        if (this.clearHistoryButton) {
            this.clearHistoryButton.addEventListener('click', () => this.clearHistory());
        }
        
        // 分类相关
        if (this.addCategoryButton) {
            this.addCategoryButton.addEventListener('click', () => this.addCategory());
        }
        
        if (this.newCategoryInput) {
            this.newCategoryInput.addEventListener('keypress', e => {
                if (e.key === 'Enter') this.addCategory();
            });
        }
        
        if (this.resetCategoriesButton) {
            this.resetCategoriesButton.addEventListener('click', () => this.resetCategories());
        }
        
        if (this.filterCategorySelect) {
            this.filterCategorySelect.addEventListener('change', () => {
                const selectedCategoryId = this.filterCategorySelect.value;
                localStorage.setItem('selectedCategoryId', selectedCategoryId);
                this.filterFoods();
                showMessage(`已切换到${selectedCategoryId ? '分类: ' + this.filterCategorySelect.options[this.filterCategorySelect.selectedIndex].text : '所有分类'}`, 'success');
            });
        }
        
        // 关闭高级设置模态框
        this.closeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.advancedSettingsModal.style.display = 'none';
            });
        });
        
        // 点击模态框外部区域关闭
        window.addEventListener('click', (event) => {
            if (event.target === this.advancedSettingsModal) {
                this.advancedSettingsModal.style.display = 'none';
            }
        });
        
        // 保存高级设置
        if (this.saveAdvancedSettings) {
            this.saveAdvancedSettings.addEventListener('click', () => this.saveAdvancedFoodSettings());
        }
    }
    
    // 设置消息系统
    setupMessageSystem() {
        this.messageContainer = document.createElement('div');
        this.messageContainer.id = 'message-container';
        document.body.appendChild(this.messageContainer);
    }
    
    // 重新加载数据
    async reloadData() {
        await this.loadCategories();
        await this.loadFoods();
        await this.loadHistory();
        this.updateUI();
    }
    
    // 加载分类数据
    async loadCategories() {
        categoryData = initialCategories || [];
        
        if (!categoryData || categoryData.length === 0) {
            categoryData = await ServerApi.getCategories();
        }
        
        this.renderCategoryButtons();
        this.renderCategoriesList();
        this.renderCategorySelects();
    }
    
    // 加载食物数据
    async loadFoods() {
        // 先使用初始数据
        if (initialFoods && initialFoods.length > 0) {
            foods = initialFoods;
            foodsData = await ServerApi.getFoodsDetails();
        } else {
            // 从API获取详细食物数据
            foodsData = await ServerApi.getFoodsDetails();
            foods = foodsData.map(f => f.name);
        }
        
        // 从localStorage获取上次选择的分类
        const savedCategoryId = localStorage.getItem('selectedCategoryId');
        if (savedCategoryId && this.filterCategorySelect) {
            this.filterCategorySelect.value = savedCategoryId;
        }
        
        // 根据当前分类筛选
        this.filterFoods();
    }
    
    // 加载历史记录
    async loadHistory() {
        if (!initialHistory || initialHistory.length === 0) {
            history = await ServerApi.getHistory();
        }
        this.renderHistory();
    }
    
    // 更新整体UI
    updateUI() {
        this.updateTitle();
        this.updateFoodsList();
        this.updateItemName();
    }
    
    // 渲染分类按钮
    renderCategoryButtons() {
        if (!this.categoryButtons) return;
        
        // 清空现有内容，保留"全部"按钮
        this.categoryButtons.innerHTML = `
            <button class="category-btn ${!currentCategoryId ? 'active' : ''}" data-id="">全部</button>
        `;
        
        // 添加分类按钮
        categoryData.forEach(category => {
            const button = document.createElement('button');
            button.className = `category-btn ${currentCategoryId === category.id ? 'active' : ''}`;
            button.setAttribute('data-id', category.id);
            button.style.borderColor = category.color || '#ddd';
            button.textContent = category.name;
            
            button.addEventListener('click', () => {
                this.selectCategory(category.id);
            });
            
            this.categoryButtons.appendChild(button);
        });
    }
    
    // 渲染分类列表
    renderCategoriesList() {
        if (!this.categoriesList) return;
        
        this.categoriesList.innerHTML = '';
        
        categoryData.forEach(category => {
            const item = document.createElement('div');
            item.className = 'category-item';
            item.innerHTML = `
                <div class="category-info">
                    <div class="category-color" style="background-color: ${category.color || '#ccc'}"></div>
                    <div>${category.name}</div>
                </div>
                <div class="category-actions">
                    <button class="delete-category" data-id="${category.id}">×</button>
                </div>
            `;
            
            // 添加删除事件
            const deleteBtn = item.querySelector('.delete-category');
            deleteBtn.addEventListener('click', () => this.deleteCategory(category.id));
            
            this.categoriesList.appendChild(item);
        });
    }
    
    // 渲染分类下拉选择框
    renderCategorySelects() {
        // 更新筛选选择框
        if (this.filterCategorySelect) {
            const currentValue = this.filterCategorySelect.value;
            this.filterCategorySelect.innerHTML = '<option value="">所有分类</option>';
            
            categoryData.forEach(category => {
                const option = document.createElement('option');
                option.value = category.id;
                option.textContent = category.name;
                this.filterCategorySelect.appendChild(option);
            });
            
            // 尝试恢复之前的选择
            if (currentValue) {
                this.filterCategorySelect.value = currentValue;
            }
        }
        
        // 更新添加食物时的分类选择框
        if (this.newFoodCategorySelect) {
            this.newFoodCategorySelect.innerHTML = '<option value="">无分类</option>';
            
            categoryData.forEach(category => {
                const option = document.createElement('option');
                option.value = category.id;
                option.textContent = category.name;
                this.newFoodCategorySelect.appendChild(option);
            });
        }
        
        // 更新高级设置中的分类选择框
        if (this.foodCategorySelect) {
            this.foodCategorySelect.innerHTML = '<option value="">无分类</option>';
            
            categoryData.forEach(category => {
                const option = document.createElement('option');
                option.value = category.id;
                option.textContent = category.name;
                this.foodCategorySelect.appendChild(option);
            });
        }
    }
    
    // 根据分类ID筛选食物
    filterFoods() {
        let selectedCategoryId = null;
        
        // 从设置页面的筛选下拉框获取选中的分类ID
        if (this.filterCategorySelect) {
            selectedCategoryId = this.filterCategorySelect.value;
            console.log("筛选分类ID:", selectedCategoryId);
        }
        
        // 筛选食物
        if (selectedCategoryId) {
            filteredFoods = foodsData.filter(food => food.categoryId == selectedCategoryId);
            console.log(`筛选后的选项数量: ${filteredFoods.length}`);
        } else {
            filteredFoods = [...foodsData];
        }
        
        // 更新UI
        this.updateFoodsList();
        
        // 更新转盘，使用当前选中分类的选项
        if (this.foodWheel) {
            const foodNames = filteredFoods.map(food => food.name);
            this.foodWheel.updateFoods(foodNames);
        }
    }
    
    // 选择分类
    selectCategory(categoryId) {
        currentCategoryId = categoryId ? parseInt(categoryId) : null;
        
        // 更新按钮样式
        const buttons = this.categoryButtons.querySelectorAll('.category-btn');
        buttons.forEach(button => {
            button.classList.toggle('active', button.getAttribute('data-id') == currentCategoryId);
        });
        
        // 筛选食物
        this.filterFoods();
    }
    
    // 添加新分类
    async addCategory() {
        if (!this.newCategoryInput) return;
        
        const name = this.newCategoryInput.value.trim();
        if (!name) {
            showMessage('请输入分类名称', 'error');
            this.newCategoryInput.focus();
            return;
        }
        
        // 检查分类名是否已存在
        const existingCategory = categoryData.find(c => c.name === name);
        if (existingCategory) {
            showMessage('分类名称已存在', 'error');
            this.newCategoryInput.focus();
            return;
        }
        
        // 获取选中的颜色，如果没有颜色选择器则生成随机颜色
        const colorInput = document.getElementById('new-category-color');
        const color = colorInput ? colorInput.value : colors[Math.floor(Math.random() * colors.length)];
        
        // 禁用按钮防止重复点击
        const addBtn = this.addCategoryButton;
        if (addBtn) {
            addBtn.disabled = true;
            addBtn.textContent = '添加中...';
        }
        
        try {
            const result = await ServerApi.addCategory({
                name,
                color,
                iconName: null,
                description: null
            });
            
            if (result.success) {
                showMessage(result.message || '分类添加成功', 'success');
                this.newCategoryInput.value = '';
                
                // 重置颜色选择器到默认值
                if (colorInput) {
                    colorInput.value = '#3498db';
                    // 触发颜色选择器UI更新
                    const defaultColorDot = document.querySelector('.color-dot[data-color="#3498db"]');
                    if (defaultColorDot) {
                        defaultColorDot.click();
                    }
                }
                
                // 添加新分类到数据
                if (result.category) {
                    categoryData.push(result.category);
                    
                    // 更新UI
                    this.renderCategoryButtons();
                    this.renderCategoriesList();
                    this.renderCategorySelects();
                }
            } else {
                showMessage(result.message || '添加分类失败', 'error');
            }
        } catch (error) {
            console.error('添加分类时发生错误:', error);
            showMessage('添加分类时发生错误', 'error');
        } finally {
            // 恢复按钮状态
            if (addBtn) {
                addBtn.disabled = false;
                addBtn.innerHTML = '<i class="fas fa-plus"></i> 添加';
            }
        }
    }
    
    // 删除分类
    async deleteCategory(id) {
        if (confirm('确定要删除这个分类吗？该分类下的选项将变为无分类。')) {
            const result = await ServerApi.deleteCategory(id);
            
            if (result.success) {
                showMessage(result.message, 'success');
                
                // 从数据中移除
                categoryData = categoryData.filter(c => c.id !== id);
                
                // 重新加载食物数据（因为食物的分类关系已改变）
                await this.loadFoods();
                
                // 更新UI
                this.renderCategoryButtons();
                this.renderCategoriesList();
                this.renderCategorySelects();
            } else {
                showMessage(result.message, 'error');
            }
        }
    }
    
    // 重置为默认分类
    async resetCategories() {
        if (confirm('确定要重置为默认分类吗？这将删除所有自定义分类。')) {
            const categories = await ServerApi.resetCategories();
            
            if (categories && categories.length > 0) {
                showMessage('已重置为默认分类', 'success');
                
                // 更新数据
                categoryData = categories;
                
                // 重新加载食物（因为分类关系可能改变）
                await this.loadFoods();
                
                // 更新UI
                this.renderCategoryButtons();
                this.renderCategoriesList();
                this.renderCategorySelects();
            } else {
                showMessage('重置分类失败', 'error');
            }
        }
    }
    
    // 切换标签页
    switchTab(tabId) {
        this.tabBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabId);
        });
        
        this.tabContents.forEach(content => {
            content.classList.toggle('active', content.id === `${tabId}-tab`);
        });
    }
    
    // 更新标题
    updateTitle() {
        document.getElementById('wheel-title').textContent = this.wheelNameInput?.value || settings.title || '决策转盘';
    }
    
    // 更新选项列表
    updateFoodsList() {
        if (!this.foodsContainer) return;
        
        this.foodsContainer.innerHTML = '';
        
        filteredFoods.forEach(food => {
            const foodItem = document.createElement('div');
            foodItem.className = 'food-item';
            
            // 查找分类信息
            const category = categoryData.find(c => c.id === food.categoryId);
            const categoryName = category ? category.name : '';
            const categoryColor = category ? category.color : '#ccc';
            
            foodItem.innerHTML = `
                <div class="food-info">
                    <span>${food.name}</span>
                    ${categoryName ? `<span class="food-category-tag" style="background-color:${categoryColor}20; color:${categoryColor}">${categoryName}</span>` : ''}
                </div>
                <div class="food-settings">
                    ${food.isFavorite ? '<span class="favorite-icon">❤️</span>' : ''}
                    ${food.weight > 1 ? `<span class="food-weight-display"><span class="weight-icon">⭐</span>${food.weight}</span>` : ''}
                    <span class="settings-icon" data-id="${food.id}">⚙️</span>
                    <span class="delete-icon" data-id="${food.id}">×</span>
                </div>
            `;
            
            // 高级设置按钮
            const settingsIcon = foodItem.querySelector('.settings-icon');
            settingsIcon.addEventListener('click', () => this.showAdvancedSettings(food.id));
            
            // 删除按钮
            const deleteIcon = foodItem.querySelector('.delete-icon');
            deleteIcon.addEventListener('click', () => this.deleteFood(food));
            
            this.foodsContainer.appendChild(foodItem);
        });
    }
    
    // 显示高级设置模态框
    showAdvancedSettings(foodId) {
        const food = foodsData.find(f => f.id === foodId);
        if (!food) return;
        
        // 当前编辑的食物ID
        this.currentEditingFoodId = foodId;
        
        // 更新模态框内容
        this.editingFoodName.textContent = food.name;
        this.foodWeightInput.value = food.weight || 1;
        this.foodWeightInput.nextElementSibling.value = food.weight || 1;
        this.foodFavoriteCheck.checked = food.isFavorite || false;
        this.foodCategorySelect.value = food.categoryId || '';
        this.availableFromTime.value = food.availableFromTime || '';
        this.availableToTime.value = food.availableToTime || '';
        this.exclusionHoursInput.value = food.exclusionHours || 0;
        
        // 显示模态框
        this.advancedSettingsModal.style.display = 'block';
    }
    
    // 保存高级设置
    async saveAdvancedFoodSettings() {
        const foodId = this.currentEditingFoodId;
        if (!foodId) return;
        
        const food = foodsData.find(f => f.id === foodId);
        if (!food) return;
        
        // 获取表单值
        const weight = parseInt(this.foodWeightInput.value);
        const isFavorite = this.foodFavoriteCheck.checked;
        const categoryId = this.foodCategorySelect.value;
        const fromTime = this.availableFromTime.value;
        const toTime = this.availableToTime.value;
        const exclusionHours = parseInt(this.exclusionHoursInput.value);
        
        try {
            // 更新权重
            if (weight !== food.weight) {
                const weightResult = await ServerApi.setFoodWeight(foodId, weight);
                if (!weightResult.success) {
                    showMessage(weightResult.message, 'error');
                    return;
                }
            }
            
            // 更新喜爱标记
            if (isFavorite !== food.isFavorite) {
                const favoriteResult = await ServerApi.setFoodFavorite(foodId, isFavorite);
                if (!favoriteResult.success) {
                    showMessage(favoriteResult.message, 'error');
                    return;
                }
            }
            
            // 更新可用时间
            if (fromTime !== food.availableFromTime || toTime !== food.availableToTime) {
                const timeResult = await ServerApi.setFoodAvailableTime(foodId, fromTime, toTime);
                if (!timeResult.success) {
                    showMessage(timeResult.message, 'error');
                    return;
                }
            }
            
            // 更新排除规则
            if (exclusionHours !== food.exclusionHours) {
                const exclusionResult = await ServerApi.setFoodExclusionHours(foodId, exclusionHours);
                if (!exclusionResult.success) {
                    showMessage(exclusionResult.message, 'error');
                    return;
                }
            }
            
            // 更新分类（需要获取最新的食物数据）
            food.weight = weight;
            food.isFavorite = isFavorite;
            food.categoryId = categoryId ? parseInt(categoryId) : null;
            food.availableFromTime = fromTime;
            food.availableToTime = toTime;
            food.exclusionHours = exclusionHours;
            
            // 更新UI
            this.updateFoodsList();
            
            // 关闭模态框
            this.advancedSettingsModal.style.display = 'none';
            
            showMessage('选项设置已保存', 'success');
            
            // 重新加载数据以确保所有变更都应用
            await this.loadFoods();
        } catch (error) {
            console.error('保存高级设置失败:', error);
            showMessage('保存设置失败', 'error');
        }
    }
    
    // 添加食物
    async addFood() {
        const foodName = this.newFoodInput?.value.trim();
        if (!foodName) return;
        
        // 获取选择的分类ID
        const categoryId = this.newFoodCategorySelect?.value || null;
        
        // 检查重复
        if (foods.includes(foodName)) {
            showMessage('此选项已存在', 'error');
            return;
        }
        
        // 创建食物对象
        const newFood = {
            name: foodName,
            categoryId: categoryId ? parseInt(categoryId) : null
        };
        
        try {
            // 先临时添加到本地数据
            foods.push(foodName);
            
            // 清空输入框
            this.newFoodInput.value = '';
            
            // 更新UI
            this.updateFoodsList();
            this.foodWheel.updateFoods(foods);
            
            // 保存到服务器
            await this.saveSettings();
            
            // 重新加载食物数据
            await this.loadFoods();
        } catch (error) {
            console.error('添加食物失败:', error);
            showMessage('添加选项失败', 'error');
            
            // 从本地数据中移除
            foods = foods.filter(f => f !== foodName);
            this.updateFoodsList();
            this.foodWheel.updateFoods(foods);
        }
    }
    
    // 删除食物
    async deleteFood(food) {
        if (!confirm(`确定要删除选项"${food.name}"吗？`)) return;
        
        try {
            // 从本地数据中先移除
            foods = foods.filter(f => f !== food.name);
            foodsData = foodsData.filter(f => f.id !== food.id);
            filteredFoods = filteredFoods.filter(f => f.id !== food.id);
            
            // 更新UI
            this.updateFoodsList();
            this.foodWheel.updateFoods(foods);
            
            // 保存到服务器
            await this.saveSettings();
        } catch (error) {
            console.error('删除选项失败:', error);
            showMessage('删除选项失败', 'error');
            
            // 重新加载食物数据
            await this.loadFoods();
        }
    }
    
    // 保存设置
    async saveSettings() {
        try {
            // 保存食物列表
            const saveResult = await ServerApi.saveFoods(foods);
            if (!saveResult.success) {
                showMessage(saveResult.message, 'error');
                return;
            }
            
            // 保存标题和选项名称
            if (this.wheelNameInput && this.itemNameInput) {
                settings.title = this.wheelNameInput.value;
                settings.itemName = this.itemNameInput.value;
                
                const result = await ServerApi.updateSettings(settings);
                if (result) {
                    settings = result;
                }
            }
            
            showMessage('设置已保存', 'success');
            
            // 重新加载数据
            await this.loadFoods();
        } catch (error) {
            console.error('保存设置失败:', error);
            showMessage('保存设置失败', 'error');
        }
    }
    
    // 重置为默认设置
    async resetToDefaults() {
        if (!confirm('确定要恢复默认选项吗？这将删除所有自定义选项。')) return;
        
        try {
            const defaultFoods = await ServerApi.resetFoods();
            
            if (defaultFoods && defaultFoods.length > 0) {
                foods = defaultFoods;
                
                // 更新UI
                this.foodWheel.updateFoods(foods);
                
                showMessage('已恢复默认选项', 'success');
                
                // 重新加载数据
                await this.loadFoods();
            }
        } catch (error) {
            console.error('重置默认失败:', error);
            showMessage('重置默认失败', 'error');
        }
    }
    
    // 渲染历史记录
    renderHistory() {
        if (!this.historyList) return;
        
        this.historyList.innerHTML = '';
        
        if (history.length === 0) {
            this.historyList.innerHTML = `
                <div class="empty-history">
                    <i class="fas fa-clock"></i>
                    <p>暂无历史记录</p>
                    <small>开始转盘后会在这里显示历史记录</small>
                </div>
            `;
            return;
        }
        
        history.forEach((item, index) => {
            const listItem = document.createElement('div');
            listItem.className = 'history-item';
            
            // 格式化时间
            const timeStr = item.time;
            const formattedTime = new Date(timeStr).toLocaleDateString('zh-CN', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            
            // 创建分类标签
            let categoryBadge = '';
            if (item.categoryName) {
                const badgeColor = item.categoryColor || '#95a5a6';
                categoryBadge = `
                    <span class="history-category-badge" style="background-color: ${badgeColor}">
                        ${item.categoryName}
                    </span>
                `;
            }
            
            listItem.innerHTML = `
                <div class="history-content">
                    <div class="history-main">
                        <div class="history-food">
                            <i class="fas fa-star"></i>
                            <span class="food-name">${item.food}</span>
                            ${categoryBadge}
                        </div>
                        <div class="history-meta">
                            <span class="history-time">
                                <i class="fas fa-clock"></i>
                                ${formattedTime}
                            </span>
                            <span class="history-index">#${history.length - index}</span>
                        </div>
                    </div>
                </div>
            `;
            
            this.historyList.appendChild(listItem);
        });
    }
    
    // 更新选项名称
    updateItemName() {
        const itemName = this.itemNameInput?.value || settings.itemName || "选项";
        
        if (this.customOptionsTitle) {
            this.customOptionsTitle.textContent = `自定义${itemName}`;
        }
        
        // 更新输入框提示
        this.newFoodInput.placeholder = `添加新${itemName}...`;
    }
    
    // 清空历史
    async clearHistory() {
        if (confirm('确定要清空所有历史记录吗？')) {
            const success = await ServerApi.clearHistory();
            if (success) {
                this.history = [];
                history = []; // 更新全局变量
                this.renderHistory();
                showMessage('历史记录已清空', 'success');
            }
        }
    }
    
    // 空白方法，已被更通用的设置区域折叠/展开方法替代
}

// 音效生成辅助类
class SoundGenerator {
    constructor() {
        this.audioContext = null;
        this.isSoundAvailable = false;
        
        try {
            // 检查浏览器是否支持 Web Audio API
            window.AudioContext = window.AudioContext || window.webkitAudioContext;
            this.audioContext = new AudioContext();
            this.isSoundAvailable = true;
        } catch(e) {
            console.warn('Web Audio API 不受支持。将使用备用音效。');
        }
    }
    
    // 生成旋转音效
    generateSpinSound() {
        if (!this.isSoundAvailable) return;
        
        // 创建振荡器节点
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        // 设置频率和音量
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(220, this.audioContext.currentTime);
        oscillator.frequency.linearRampToValueAtTime(660, this.audioContext.currentTime + 1.5);
        
        gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 2);
        
        // 开始播放
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 2);
    }
    
    // 生成结果音效
    generateResultSound() {
        if (!this.isSoundAvailable) return;
        
        // 创建振荡器节点
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        // 设置频率和音量
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(880, this.audioContext.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(440, this.audioContext.currentTime + 0.2);
        
        gainNode.gain.setValueAtTime(0.5, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);
        
        // 开始播放
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 0.5);
    }
}

// 显示消息
function showMessage(message, type = 'success') {
    const messageElement = document.createElement('div');
    messageElement.className = `message ${type} auto-hide`;
    messageElement.textContent = message;
    
    const container = document.getElementById('message-container');
    if (container) {
        container.appendChild(messageElement);
    } else {
        document.body.appendChild(messageElement);
    }
    
    // 自动隐藏
    setTimeout(() => {
        messageElement.classList.add('hidden');
        setTimeout(() => messageElement.remove(), 500);
    }, 3000);
}

// 创建音效生成器实例
const soundGenerator = new SoundGenerator();

// 应用程序初始化
document.addEventListener('DOMContentLoaded', async () => {
    // 调整转盘尺寸
    const resizeWheel = () => {
        const wheelContainer = document.querySelector('.wheel-container');
        const size = Math.min(wheelContainer.clientWidth, 400);
        wheel.width = wheel.height = size;
        wheelRadius = size / 2;
        foodWheel.resize();
    };
    
    // 初始化转盘
    const foodWheel = new FoodWheel(wheel, initialFoods || []);
    
    // 初始化 UI 管理
    const ui = new UIManager(foodWheel);
    
    // 显示初始指向的食物
    if (foods.length > 0) {
        const initialFood = getCurrentSelectedFood(foodWheel);
        const itemName = settings?.itemName || "选项";
        resultDiv.textContent = `指针指向${itemName}：${initialFood}`;
    }
    
    // 添加一个消息，显示当前使用的分类
    const savedCategoryId = localStorage.getItem('selectedCategoryId');
    if (savedCategoryId) {
        const categorySelect = document.getElementById('filter-category');
        if (categorySelect) {
            const selectedOption = Array.from(categorySelect.options).find(option => option.value === savedCategoryId);
            if (selectedOption) {
                setTimeout(() => {
                    showMessage(`当前显示分类: ${selectedOption.textContent}`, 'info');
                }, 1000);
            }
        }
    }
    
    // 设置部分折叠/展开功能已移至settings.js中处理
    
    // 获取当前指针指向的食物
    function getCurrentSelectedFood(wheel) {
        if (wheel.foods.length === 0) return "";
        
        const sectorAngle = 360 / wheel.foods.length;
        const deg = (wheel.angle % 360 + 360) % 360;
        const pointerDeg = (270 - deg + 360) % 360;
        const idx = Math.floor(pointerDeg / sectorAngle) % wheel.foods.length;
        return wheel.foods[idx];
    }
    
    // 绑定旋转按钮
    spinBtn.addEventListener('click', () => {
        if (foods.length === 0) {
            const itemName = settings?.itemName || "选项";
            alert(`请先添加${itemName}`);
            return;
        }
        
        resultDiv.textContent = '';
        foodWheel.spin((result) => {
            const itemName = settings?.itemName || "选项";
            resultDiv.textContent = `选中${itemName}：${result}`;
            
            // 刷新UI（历史记录会自动更新，因为后端已经添加了）
            ui.reloadData();
        });
    });
    
    // 初始调整尺寸
    resizeWheel();
    
    // 监听窗口大小变化
    window.addEventListener('resize', resizeWheel);
});
