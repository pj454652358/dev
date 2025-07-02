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
    spin(callback, weeklyFoods = []) {
        if (this.spinning) return;
        if (this.foods.length === 0) {
            alert('请先添加食物选项');
            return;
        }
        
        this.spinning = true;
        
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
        
        // 确保不会连续选择同一个结果，且避开一周内已选择的食物
        let extraSpin = Math.random() * 360 + 360 * 5; // 至少转5圈
        let targetIdx;
        let targetFood;
        let availableFoods = [...this.foods];
        
        // 从可选食物中排除一周内已选食物
        if (weeklyFoods.length > 0) {
            // 提取过去一周内已选择的食物名称
            const recentFoods = weeklyFoods.map(item => item.food);
            
            // 从可选食物中过滤掉最近一周已选择的食物
            const filteredFoods = this.foods.filter(food => !recentFoods.includes(food));
            
            // 如果过滤后还有食物可选，则使用过滤后的列表；否则使用所有食物
            if (filteredFoods.length > 0) {
                availableFoods = filteredFoods;
            } else if (this.foods.length > 1) {
                // 如果所有食物都在一周内选过了，但有多个选项，至少避免选到上次的食物
                availableFoods = this.foods.filter(food => food !== this.foods[this.lastIdx]);
            }
        }
        
        // 从可用食物中随机选择一个
        const randomIndex = Math.floor(Math.random() * availableFoods.length);
        targetFood = availableFoods[randomIndex];
        
        // 找到这个食物在原始食物列表中的索引
        targetIdx = this.foods.indexOf(targetFood);
        this.lastIdx = targetIdx;
        
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
                try {
                    resultSound.currentTime = 0;
                    const playPromise = resultSound.play();
                    
                    if (playPromise !== undefined) {
                        playPromise.catch(error => {
                            console.warn('结果音效文件播放失败，使用生成的音效代替', error);
                            soundGenerator.generateResultSound();
                        });
                    }
                } catch(e) {
                    soundGenerator.generateResultSound();
                }
                
                if (callback) callback(this.foods[targetIdx]);
            }
        };
        
        requestAnimationFrame(animateWheel);
    }
}

// 存储管理类
class StorageManager {
    constructor() {
        this.API_URL = 'http://localhost:5000/api';
        this.FOODS_KEY = 'lunch_wheel_foods';
        this.HISTORY_KEY = 'lunch_wheel_history';
        this.WEEKLY_FOODS_KEY = 'lunch_wheel_weekly_foods';
        
        // 本地备份模式标记，当API不可用时切换到本地存储
        this.useLocalBackup = false;
    }
    
    // API请求基础方法
    async apiRequest(endpoint, method = 'GET', data = null) {
        try {
            const options = {
                method,
                headers: {
                    'Content-Type': 'application/json',
                },
            };
            
            if (data) {
                options.body = JSON.stringify(data);
            }
            
            const response = await fetch(`${this.API_URL}/${endpoint}`, options);
            
            if (!response.ok) {
                throw new Error(`API 请求失败: ${response.status}`);
            }
            
            if (method === 'DELETE') {
                return true;
            }
            
            return await response.json();
        } catch (error) {
            console.error('API 请求错误:', error);
            this.useLocalBackup = true;
            return null;
        }
    }
    
    // 保存食物列表
    async saveFoods(foods) {
        if (this.useLocalBackup) {
            localStorage.setItem(this.FOODS_KEY, JSON.stringify(foods));
            return;
        }
        
        try {
            // 首先获取现有的食物列表
            const existingFoods = await this.apiRequest('Foods');
            
            if (!existingFoods) {
                // 如果API不可用，退回到本地存储
                localStorage.setItem(this.FOODS_KEY, JSON.stringify(foods));
                return;
            }
            
            // 删除不在新列表中的食物
            for (const existingFood of existingFoods) {
                if (!foods.includes(existingFood.name)) {
                    await this.apiRequest(`Foods/${existingFood.id}`, 'DELETE');
                }
            }
            
            // 添加新食物
            for (const food of foods) {
                if (!existingFoods.some(ef => ef.name === food)) {
                    await this.apiRequest('Foods', 'POST', { name: food, isDefault: false });
                }
            }
        } catch (error) {
            console.error('保存食物列表错误:', error);
            // 退回到本地存储
            localStorage.setItem(this.FOODS_KEY, JSON.stringify(foods));
        }
    }
    
    // 加载食物列表
    async loadFoods() {
        if (this.useLocalBackup) {
            const saved = localStorage.getItem(this.FOODS_KEY);
            return saved ? JSON.parse(saved) : [...DEFAULT_FOODS];
        }
        
        try {
            const foods = await this.apiRequest('Foods');
            
            if (!foods) {
                const saved = localStorage.getItem(this.FOODS_KEY);
                return saved ? JSON.parse(saved) : [...DEFAULT_FOODS];
            }
            
            // 从对象列表转换为名称数组
            return foods.map(food => food.name);
        } catch (error) {
            console.error('加载食物列表错误:', error);
            // 退回到本地存储
            const saved = localStorage.getItem(this.FOODS_KEY);
            return saved ? JSON.parse(saved) : [...DEFAULT_FOODS];
        }
    }
    
    // 保存历史记录
    async saveHistory(history) {
        if (this.useLocalBackup) {
            localStorage.setItem(this.HISTORY_KEY, JSON.stringify(history));
            return;
        }
        
        // 这里我们不需要保存整个历史记录，因为历史记录是通过API逐条添加的
        // 但是如果API不可用，我们仍然需要保存到本地
        if (history.length > 0 && history[0].time && !history[0].saved) {
            try {
                const result = await this.apiRequest('History', 'POST', {
                    food: history[0].food,
                    time: new Date(history[0].time)
                });
                
                if (result) {
                    // 标记为已保存
                    history[0].saved = true;
                }
            } catch (error) {
                console.error('保存历史记录错误:', error);
            }
        }
        
        // 总是备份到本地存储
        localStorage.setItem(this.HISTORY_KEY, JSON.stringify(history));
    }
    
    // 加载历史记录
    async loadHistory() {
        if (this.useLocalBackup) {
            const saved = localStorage.getItem(this.HISTORY_KEY);
            return saved ? JSON.parse(saved) : [];
        }
        
        try {
            const history = await this.apiRequest('History');
            
            if (!history) {
                const saved = localStorage.getItem(this.HISTORY_KEY);
                return saved ? JSON.parse(saved) : [];
            }
            
            // 转换为前端使用的格式
            return history.map(item => ({
                food: item.food,
                time: new Date(item.time).toLocaleString(),
                saved: true
            }));
        } catch (error) {
            console.error('加载历史记录错误:', error);
            // 退回到本地存储
            const saved = localStorage.getItem(this.HISTORY_KEY);
            return saved ? JSON.parse(saved) : [];
        }
    }
    
    // 清空历史记录
    async clearHistory() {
        if (this.useLocalBackup) {
            localStorage.removeItem(this.HISTORY_KEY);
            return;
        }
        
        try {
            await this.apiRequest('History', 'DELETE');
            localStorage.removeItem(this.HISTORY_KEY);
        } catch (error) {
            console.error('清空历史记录错误:', error);
            localStorage.removeItem(this.HISTORY_KEY);
        }
    }
    
    // 加载本周已选食物
    async loadWeeklyFoods() {
        if (this.useLocalBackup) {
            const saved = localStorage.getItem(this.WEEKLY_FOODS_KEY);
            if (!saved) return [];
            
            const weeklyFoods = JSON.parse(saved);
            
            // 清理超过一周的记录
            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
            
            // 过滤掉一周前的记录
            const filteredFoods = weeklyFoods.filter(item => {
                return new Date(item.date) >= oneWeekAgo;
            });
            
            // 如果有记录被过滤掉，则保存更新后的列表
            if (filteredFoods.length !== weeklyFoods.length) {
                this.saveWeeklyFoods(filteredFoods);
            }
            
            return filteredFoods;
        }
        
        try {
            const weeklyFoods = await this.apiRequest('WeeklyFoods');
            
            if (!weeklyFoods) {
                return this.loadWeeklyFoodsFromLocal();
            }
            
            // 转换为前端使用的格式
            return weeklyFoods.map(item => ({
                food: item.food,
                date: item.date
            }));
        } catch (error) {
            console.error('加载周食物错误:', error);
            return this.loadWeeklyFoodsFromLocal();
        }
    }
    
    // 从本地加载周食物（备份方法）
    loadWeeklyFoodsFromLocal() {
        const saved = localStorage.getItem(this.WEEKLY_FOODS_KEY);
        if (!saved) return [];
        
        const weeklyFoods = JSON.parse(saved);
        
        // 清理超过一周的记录
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        
        // 过滤掉一周前的记录
        return weeklyFoods.filter(item => {
            return new Date(item.date) >= oneWeekAgo;
        });
    }
    
    // 清空一周内已选食物
    async clearWeeklyFoods() {
        if (this.useLocalBackup) {
            localStorage.removeItem(this.WEEKLY_FOODS_KEY);
            return;
        }
        
        try {
            await this.apiRequest('WeeklyFoods', 'DELETE');
            localStorage.removeItem(this.WEEKLY_FOODS_KEY);
        } catch (error) {
            console.error('清空周食物错误:', error);
            localStorage.removeItem(this.WEEKLY_FOODS_KEY);
        }
    }
    
    // 添加一个食物到本周已选列表
    // 注意: 这个方法通常不需要直接调用，因为当添加历史记录时会自动添加到周食物
    async addToWeeklyFoods(food) {
        if (this.useLocalBackup) {
            const weeklyFoods = await this.loadWeeklyFoods();
            weeklyFoods.push({
                food: food,
                date: new Date().toISOString()
            });
            localStorage.setItem(this.WEEKLY_FOODS_KEY, JSON.stringify(weeklyFoods));
            return;
        }
        
        // 在保存历史记录时已经添加了，这里不需要额外操作
    }
    
    // 重置为默认食物列表
    async resetToDefaults() {
        if (this.useLocalBackup) {
            return [...DEFAULT_FOODS];
        }
        
        try {
            const foods = await this.apiRequest('Foods/reset', 'POST');
            
            if (!foods) {
                return [...DEFAULT_FOODS];
            }
            
            return foods.map(food => food.name);
        } catch (error) {
            console.error('重置默认食物错误:', error);
            return [...DEFAULT_FOODS];
        }
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
    async init() {
        // 加载数据
        this.foods = await this.storage.loadFoods();
        this.history = await this.storage.loadHistory();
        this.weeklyFoods = await this.storage.loadWeeklyFoods();
        
        // 更新 UI
        this.updateFoodWheel();
        this.renderFoodList();
        this.renderHistory();
        this.renderWeeklyFoods();
        
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
        
        // 清空一周内已选食物
        const clearWeeklyFoodsBtn = document.getElementById('clear-weekly-foods');
        if (clearWeeklyFoodsBtn) {
            clearWeeklyFoodsBtn.addEventListener('click', () => this.clearWeeklyFoods());
        }
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
    async resetToDefault() {
        if (confirm('确定要恢复默认食物列表吗？这将删除所有自定义选项。')) {
            // 使用API重置为默认食物列表
            this.foods = await this.storage.resetToDefaults();
            this.renderFoodList();
            this.updateFoodWheel();
        }
    }
    
    // 保存设置
    async saveSettings() {
        await this.storage.saveFoods(this.foods);
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
    async addHistory(food) {
        const now = new Date();
        const time = now.toLocaleString();
        this.history.unshift({ food, time });
        
        // 限制历史记录数量
        if (this.history.length > 50) {
            this.history.pop();
        }
        
        await this.storage.saveHistory(this.history);
        
        // 重新加载历史记录和周食物数据
        this.history = await this.storage.loadHistory();
        this.weeklyFoods = await this.storage.loadWeeklyFoods();
        
        this.renderHistory();
        this.renderWeeklyFoods(); // 更新一周内已选食物显示
    }
    
    // 获取一周内已选择的食物
    getWeeklyFoods() {
        return this.storage.loadWeeklyFoods();
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
    
    // 渲染一周内已选食物
    renderWeeklyFoods() {
        const weeklyFoodsContainer = document.getElementById('weekly-foods-container');
        const weeklyFoods = this.weeklyFoods;
        
        if (!weeklyFoods || weeklyFoods.length === 0) {
            weeklyFoodsContainer.innerHTML = '<p>本周还没有选择过食物</p>';
            return;
        }
        
        weeklyFoodsContainer.innerHTML = '';
        
        // 对食物进行分组，避免显示重复项
        const foodGroups = {};
        weeklyFoods.forEach(item => {
            if (!foodGroups[item.food]) {
                foodGroups[item.food] = {
                    food: item.food,
                    dates: [new Date(item.date)]
                };
            } else {
                foodGroups[item.food].dates.push(new Date(item.date));
            }
        });
        
        // 为每个食物创建标签
        Object.values(foodGroups).forEach((group, index) => {
            const weeklyFoodItem = document.createElement('div');
            weeklyFoodItem.className = 'weekly-food-item';
            
            // 设置随机颜色背景（使用转盘中的颜色数组）
            weeklyFoodItem.style.backgroundColor = colors[index % colors.length];
            
            // 格式化最近日期 (使用更简洁的格式)
            const latestDate = new Date(Math.max(...group.dates.map(d => d.getTime())));
            
            // 获取月日
            const month = latestDate.getMonth() + 1;
            const day = latestDate.getDate();
            
            // 如果有多个日期，显示次数而不是具体日期
            const dateDisplay = group.dates.length > 1 
                ? `${month}/${day} (+${group.dates.length - 1})` 
                : `${month}/${day}`;
            
            weeklyFoodItem.innerHTML = `
                ${group.food}
                <span class="weekly-food-date">${dateDisplay}</span>
            `;
            
            weeklyFoodsContainer.appendChild(weeklyFoodItem);
        });
    }
    
    // 清空历史
    async clearHistory() {
        if (confirm('确定要清空所有历史记录吗？')) {
            await this.storage.clearHistory();
            this.history = [];
            this.renderHistory();
        }
    }
    
    // 清空一周内已选食物
    async clearWeeklyFoods() {
        if (confirm('确定要清空一周内已选食物记录吗？')) {
            await this.storage.clearWeeklyFoods();
            this.weeklyFoods = [];
            this.renderWeeklyFoods();
        }
    }
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
    
    // 初始化存储
    const storage = new StorageManager();
    
    // 加载初始数据
    foods = await storage.loadFoods();
    history = await storage.loadHistory();
    
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
        
        // 获取一周内已选择的食物
        const weeklyFoods = ui.getWeeklyFoods();
        
        resultDiv.textContent = '';
        foodWheel.spin((result) => {
            resultDiv.textContent = `选中：${result}`;
            ui.addHistory(result);
        }, weeklyFoods);
    });
    
    // 初始调整尺寸
    resizeWheel();
    
    // 监听窗口大小变化
    window.addEventListener('resize', resizeWheel);
});
