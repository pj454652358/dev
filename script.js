// 默认食物列表
const DEFAULT_FOODS = [
    '米饭套餐', '面条', '麻辣烫', '沙县小吃', '快餐', '自助餐', 
    '火锅', '烧烤', '汉堡', '寿司', '炸鸡', '沙拉'
];

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
let foods = [];
let angle = 0;
let spinning = false;
let wheelRadius;
let lastResult = null;
let history = [];

// 食物转盘类
class FoodWheel {
    constructor(canvas, foods) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.foods = foods;
        this.spinning = false;
        this.lastIdx = null;
        
        // 初始化角度，让指针指向第一个食物选项的中间
        this.initializeAngle();
        
        // 自动设置尺寸
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }
    
    // 初始化角度，让指针指向一个食物选项的中间
    initializeAngle() {
        if (this.foods.length === 0) {
            this.angle = 0;
            return;
        }
        
        // 可以选择固定指向第一个食物或随机选择一个食物
        // const initialFoodIdx = 0; // 固定指向第一个食物
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
    spin(callback) {
        if (this.spinning) return;
        if (this.foods.length === 0) {
            alert('请先添加食物选项');
            return;
        }
        
        this.spinning = true;
        spinSound.currentTime = 0;
        spinSound.play();
        
        // 确保不会连续选择同一个结果
        let extraSpin = Math.random() * 360 + 360 * 5; // 至少转5圈
        let targetIdx;
        
        // 计算目标位置，避免连续相同结果
        do {
            targetIdx = Math.floor(Math.random() * this.foods.length);
        } while (this.foods.length > 1 && targetIdx === this.lastIdx);
        
        // 计算指向目标食物中心的角度
        const sectorAngle = 360 / this.foods.length;
        const targetAngle = 270 - (targetIdx * sectorAngle + sectorAngle / 2);
        
        // 计算旋转量，确保转够几圈后指向目标
        let start = this.angle % 360;
        let target = Math.floor(this.angle / 360) * 360 + targetAngle + 360;
        
        if (target - start < 360 * 3) {
            target += 360 * 3;
        }
        
        let duration = 4000; // 旋转时间
        let startTime = null;
        
        const animateWheel = (ts) => {
            if (!startTime) startTime = ts;
            let elapsed = ts - startTime;
            let progress = Math.min(elapsed / duration, 1);
            
            // 缓动函数，使旋转更自然
            let easeOut = (t) => 1 - Math.pow(1 - t, 3);
            let currentAngle = start + (target - start) * easeOut(progress);
            this.angle = currentAngle;
            
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.draw();
            
            if (progress < 1) {
                requestAnimationFrame(animateWheel);
            } else {
                this.angle = this.angle % 360;
                this.spinning = false;
                this.lastIdx = targetIdx;
                
                // 播放结果声音
                resultSound.currentTime = 0;
                resultSound.play();
                
                if (callback) callback(this.foods[targetIdx]);
            }
        };
        
        requestAnimationFrame(animateWheel);
    }
}

// 存储管理类
class StorageManager {
    constructor() {
        this.FOODS_KEY = 'lunch_wheel_foods';
        this.HISTORY_KEY = 'lunch_wheel_history';
    }
    
    // 保存食物列表
    saveFoods(foods) {
        localStorage.setItem(this.FOODS_KEY, JSON.stringify(foods));
    }
    
    // 加载食物列表
    loadFoods() {
        const saved = localStorage.getItem(this.FOODS_KEY);
        return saved ? JSON.parse(saved) : [...DEFAULT_FOODS];
    }
    
    // 保存历史记录
    saveHistory(history) {
        localStorage.setItem(this.HISTORY_KEY, JSON.stringify(history));
    }
    
    // 加载历史记录
    loadHistory() {
        const saved = localStorage.getItem(this.HISTORY_KEY);
        return saved ? JSON.parse(saved) : [];
    }
}

// UI 管理类
class UIManager {
    constructor(foodWheel, storageManager) {
        this.foodWheel = foodWheel;
        this.storage = storageManager;
        this.foods = [];
        this.history = [];
        
        // DOM 元素
        this.tabButtons = document.querySelectorAll('.tab-btn');
        this.tabContents = document.querySelectorAll('.tab-content');
        this.foodsContainer = document.getElementById('foods-container');
        this.newFoodInput = document.getElementById('new-food');
        this.addFoodBtn = document.getElementById('add-btn');
        this.resetDefaultBtn = document.getElementById('reset-default');
        this.saveSettingsBtn = document.getElementById('save-settings');
        this.historyList = document.getElementById('history-list');
        this.clearHistoryBtn = document.getElementById('clear-history');
        
        // 初始化
        this.init();
    }
    
    // 初始化
    init() {
        // 加载数据
        this.foods = this.storage.loadFoods();
        this.history = this.storage.loadHistory();
        
        // 更新 UI
        this.updateFoodWheel();
        this.renderFoodList();
        this.renderHistory();
        
        // 设置事件监听
        this.setupEventListeners();
    }
    
    // 设置事件监听器
    setupEventListeners() {
        // 标签切换
        this.tabButtons.forEach(btn => {
            btn.addEventListener('click', () => this.switchTab(btn.dataset.tab));
        });
        
        // 食物设置
        this.addFoodBtn.addEventListener('click', () => this.addFood());
        this.newFoodInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addFood();
        });
        this.resetDefaultBtn.addEventListener('click', () => this.resetToDefault());
        this.saveSettingsBtn.addEventListener('click', () => this.saveSettings());
        
        // 清空历史
        this.clearHistoryBtn.addEventListener('click', () => this.clearHistory());
    }
    
    // 切换标签
    switchTab(tabId) {
        this.tabButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabId);
        });
        
        this.tabContents.forEach(content => {
            content.classList.toggle('active', content.id === `${tabId}-tab`);
        });
    }
    
    // 添加新食物
    addFood() {
        const food = this.newFoodInput.value.trim();
        if (food && !this.foods.includes(food)) {
            this.foods.push(food);
            this.renderFoodList();
            this.newFoodInput.value = '';
            this.updateFoodWheel();
        }
    }
    
    // 删除食物
    removeFood(index) {
        this.foods.splice(index, 1);
        this.renderFoodList();
        this.updateFoodWheel();
    }
    
    // 恢复默认食物列表
    resetToDefault() {
        if (confirm('确定要恢复默认食物列表吗？这将删除所有自定义选项。')) {
            this.foods = [...DEFAULT_FOODS];
            this.renderFoodList();
            this.updateFoodWheel();
        }
    }
    
    // 保存设置
    saveSettings() {
        this.storage.saveFoods(this.foods);
        alert('设置已保存！');
    }
    
    // 渲染食物列表
    renderFoodList() {
        this.foodsContainer.innerHTML = '';
        this.foods.forEach((food, index) => {
            const item = document.createElement('div');
            item.className = 'food-item';
            item.innerHTML = `
                <div class="food-name">${food}</div>
                <div class="food-actions">
                    <button class="delete-btn" title="删除"><i class="fas fa-trash-alt"></i></button>
                </div>
            `;
            
            item.querySelector('.delete-btn').addEventListener('click', () => this.removeFood(index));
            this.foodsContainer.appendChild(item);
        });
    }
    
    // 更新转盘
    updateFoodWheel() {
        this.foodWheel.foods = this.foods;
        this.foodWheel.draw();
    }
    
    // 添加历史记录
    addHistory(food) {
        const now = new Date();
        const time = now.toLocaleString();
        this.history.unshift({ food, time });
        
        // 限制历史记录数量
        if (this.history.length > 50) {
            this.history.pop();
        }
        
        this.storage.saveHistory(this.history);
        this.renderHistory();
    }
    
    // 渲染历史记录
    renderHistory() {
        this.historyList.innerHTML = '';
        if (this.history.length === 0) {
            this.historyList.innerHTML = '<div class="empty-history">还没有历史记录</div>';
            return;
        }
        
        this.history.forEach(item => {
            const historyItem = document.createElement('div');
            historyItem.className = 'history-item';
            historyItem.innerHTML = `
                <span class="history-food">${item.food}</span>
                <span class="history-time">${item.time}</span>
            `;
            this.historyList.appendChild(historyItem);
        });
    }
    
    // 清空历史
    clearHistory() {
        if (confirm('确定要清空所有历史记录吗？')) {
            this.history = [];
            this.storage.saveHistory(this.history);
            this.renderHistory();
        }
    }
}

// 应用程序初始化
document.addEventListener('DOMContentLoaded', () => {
    // 调整转盘尺寸
    const resizeWheel = () => {
        const wheelContainer = document.querySelector('.wheel-container');
        const size = Math.min(wheelContainer.clientWidth, 400);
        wheel.width = wheel.height = size;
        wheelRadius = size / 2;
        foodWheel.resize();
    };
    
    // 初始化存储
    const storage = new StorageManager();
    
    // 加载初始数据
    foods = storage.loadFoods();
    history = storage.loadHistory();
    
    // 初始化转盘
    const foodWheel = new FoodWheel(wheel, foods);
    
    // 初始化 UI 管理
    const ui = new UIManager(foodWheel, storage);
    
    // 显示初始指向的食物
    if (foods.length > 0) {
        const initialFood = getCurrentSelectedFood(foodWheel);
        resultDiv.textContent = `指针指向：${initialFood}`;
    }
    
    // 获取当前指针指向的食物
    function getCurrentSelectedFood(wheel) {
        const sectorAngle = 360 / wheel.foods.length;
        const deg = (wheel.angle % 360 + 360) % 360;
        const pointerDeg = (270 - deg + 360) % 360;
        const idx = Math.floor(pointerDeg / sectorAngle) % wheel.foods.length;
        return wheel.foods[idx];
    }
    
    // 绑定旋转按钮
    spinBtn.addEventListener('click', () => {
        if (foods.length === 0) {
            alert('请先添加食物选项');
            return;
        }
        
        resultDiv.textContent = '';
        foodWheel.spin((result) => {
            resultDiv.textContent = `选中：${result}`;
            ui.addHistory(result);
        });
    });
    
    // 初始调整尺寸
    resizeWheel();
    
    // 监听窗口大小变化
    window.addEventListener('resize', resizeWheel);
});
