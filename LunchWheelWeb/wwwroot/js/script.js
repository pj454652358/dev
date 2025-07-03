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
let foods = initialFoods || [];
let angle = 0;
let spinning = false;
let wheelRadius;
let lastResult = null;
let history = initialHistory || [];
let weeklyFoods = initialWeeklyFoods || [];

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

// 服务器通信类
class ServerApi {
    // 获取食物列表
    static async getFoods() {
        try {
            const response = await fetch('/api/LunchWheel/foods');
            if (!response.ok) throw new Error('获取食物列表失败');
            return await response.json();
        } catch (error) {
            console.error('获取食物列表错误:', error);
            return null;
        }
    }
    
    // 保存食物列表
    static async saveFoods(foods) {
        try {
            const response = await fetch('/api/LunchWheel/foods/save', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(foods)
            });
            
            if (!response.ok) throw new Error('保存食物列表失败');
            
            const result = await response.json();
            if (result) {
                ServerApi.showMessage(result.success ? 'success' : 'error', result.message);
            }
            return result.success;
        } catch (error) {
            console.error('保存食物列表错误:', error);
            ServerApi.showMessage('error', '保存食物列表时发生错误');
            return false;
        }
    }
    
    // 显示消息
    static showMessage(type, message) {
        // 检查是否存在旧消息元素，如果有则移除
        const oldSuccessMessage = document.getElementById('js-success-message');
        const oldErrorMessage = document.getElementById('js-error-message');
        if (oldSuccessMessage) oldSuccessMessage.remove();
        if (oldErrorMessage) oldErrorMessage.remove();
        
        // 创建新消息元素
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        messageDiv.id = `js-${type}-message`;
        messageDiv.textContent = message;
        
        // 添加到页面
        document.body.insertBefore(messageDiv, document.body.firstChild);
        
        // 3秒后自动消失
        setTimeout(() => {
            messageDiv.style.opacity = '0';
            messageDiv.style.transition = 'opacity 0.5s';
            setTimeout(() => messageDiv.remove(), 500);
        }, 3000);
    }
    
    // 重置为默认食物
    static async resetToDefaults() {
        try {
            const response = await fetch('/api/LunchWheel/foods/reset', {
                method: 'POST'
            });
            if (!response.ok) throw new Error('重置默认食物失败');
            return await response.json();
        } catch (error) {
            console.error('重置默认食物错误:', error);
            return null;
        }
    }
    
    // 添加历史记录
    static async addHistory(food) {
        try {
            const response = await fetch('/api/LunchWheel/history', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ food: food, time: new Date() })
            });
            if (!response.ok) throw new Error('添加历史记录失败');
            return true;
        } catch (error) {
            console.error('添加历史记录错误:', error);
            return false;
        }
    }
    
    // 获取历史记录
    static async getHistory() {
        try {
            const response = await fetch('/api/LunchWheel/history');
            if (!response.ok) throw new Error('获取历史记录失败');
            return await response.json();
        } catch (error) {
            console.error('获取历史记录错误:', error);
            return null;
        }
    }
    
    // 清空历史记录
    static async clearHistory() {
        try {
            const response = await fetch('/api/LunchWheel/history', {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error('清空历史记录失败');
            return true;
        } catch (error) {
            console.error('清空历史记录错误:', error);
            return false;
        }
    }
    
    // 获取周食物
    static async getWeeklyFoods() {
        try {
            const response = await fetch('/api/LunchWheel/weeklyFoods');
            if (!response.ok) throw new Error('获取周食物失败');
            return await response.json();
        } catch (error) {
            console.error('获取周食物错误:', error);
            return null;
        }
    }
    
    // 清空周食物
    static async clearWeeklyFoods() {
        try {
            const response = await fetch('/api/LunchWheel/weeklyFoods', {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error('清空周食物失败');
            return true;
        } catch (error) {
            console.error('清空周食物错误:', error);
            return false;
        }
    }
    
    // 删除特定的周食物
    static async deleteWeeklyFood(foodName) {
        try {
            const encodedFoodName = encodeURIComponent(foodName);
            const response = await fetch(`/api/LunchWheel/weeklyFoods/${encodedFoodName}`, {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error('删除周食物失败');
            
            const result = await response.json();
            if (result.success) {
                ServerApi.showMessage('success', result.message);
            }
            return result.success;
        } catch (error) {
            console.error('删除周食物错误:', error);
            ServerApi.showMessage('error', '删除周食物失败');
            return false;
        }
    }
}

// UI 管理类
class UIManager {
    constructor(foodWheel) {
        this.foodWheel = foodWheel;
        this.foods = [];
        this.history = [];
        this.weeklyFoods = [];
        
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
        this.foods = foods;
        this.history = history;
        this.weeklyFoods = weeklyFoods;
        
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
    async addFood() {
        const food = this.newFoodInput.value.trim();
        
        // 前端验证
        if (!food) {
            ServerApi.showMessage('error', '食物名称不能为空');
            return;
        }
        
        if (this.foods.includes(food)) {
            ServerApi.showMessage('error', '此食物已存在，不能重复添加');
            return;
        }
        
        // 添加到列表
        this.foods.push(food);
        this.renderFoodList();
        this.newFoodInput.value = '';
        this.updateFoodWheel();
        
        // 自动保存
        await this.autoSaveFoods();
    }
    
    // 删除食物
    async removeFood(index) {
        this.foods.splice(index, 1);
        this.renderFoodList();
        this.updateFoodWheel();
        
        // 自动保存
        await this.autoSaveFoods();
    }
    
    // 自动保存食物列表
    async autoSaveFoods() {
        try {
            const success = await ServerApi.saveFoods(this.foods);
            if (success) {
                console.log('食物列表已自动保存');
                // 不显示成功消息，避免干扰用户
            } else {
                ServerApi.showMessage('error', '食物列表自动保存失败');
            }
        } catch (error) {
            console.error('自动保存失败:', error);
            ServerApi.showMessage('error', '食物列表自动保存失败');
        }
    }
    
    // 恢复默认食物列表
    async resetToDefault() {
        if (confirm('确定要恢复默认食物列表吗？这将删除所有自定义选项。')) {
            // 使用API重置为默认食物列表
            const defaultFoods = await ServerApi.resetToDefaults();
            if (defaultFoods) {
                this.foods = defaultFoods;
                foods = defaultFoods; // 更新全局变量
                this.renderFoodList();
                this.updateFoodWheel();
                // 已通过API重置，无需再次保存
            }
        }
    }
    
    // 保存设置
    async saveSettings() {
        const success = await ServerApi.saveFoods(this.foods);
        if (success) {
            alert('设置已保存！');
        } else {
            alert('设置保存失败！');
        }
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
                    <button class="delete-btn" title="删除这个选项">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
            `;
            
            const deleteBtn = item.querySelector('.delete-btn');
            deleteBtn.addEventListener('click', (e) => {
                e.preventDefault();
                // 添加一个简单的删除动画
                item.style.opacity = '0';
                item.style.transform = 'translateX(20px)';
                item.style.transition = 'all 0.3s ease';
                
                // 动画结束后再删除
                setTimeout(() => {
                    this.removeFood(index);
                }, 300);
            });
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
        
        // 添加到本地历史
        this.history.unshift({ food, time, saved: false });
        
        // 限制历史记录数量
        if (this.history.length > 50) {
            this.history.pop();
        }
        
        // 发送到服务器
        await ServerApi.addHistory(food);
        
        // 重新加载历史和周食物
        this.reloadData();
    }
    
    // 重新加载数据
    async reloadData() {
        // 重新加载历史和周食物
        const newHistory = await ServerApi.getHistory();
        const newWeeklyFoods = await ServerApi.getWeeklyFoods();
        
        if (newHistory) {
            this.history = newHistory;
            history = newHistory; // 更新全局变量
        }
        
        if (newWeeklyFoods) {
            this.weeklyFoods = newWeeklyFoods;
            weeklyFoods = newWeeklyFoods; // 更新全局变量
        }
        
        this.renderHistory();
        this.renderWeeklyFoods();
    }
    
    // 获取一周内已选择的食物
    getWeeklyFoods() {
        return this.weeklyFoods;
    }
    
    // 渲染历史记录
    renderHistory() {
        this.historyList.innerHTML = '';
        if (!this.history || this.history.length === 0) {
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
            const bgColor = colors[index % colors.length];
            weeklyFoodItem.style.backgroundColor = bgColor;
            
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
                <div class="weekly-food-content">
                    <span class="weekly-food-name">${group.food}</span>
                    <span class="weekly-food-date">${dateDisplay}</span>
                </div>
                <button class="weekly-food-delete" title="删除此食物记录">
                    <i class="fas fa-times"></i>
                </button>
            `;
            
            // 添加删除事件
            const deleteBtn = weeklyFoodItem.querySelector('.weekly-food-delete');
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // 防止事件冒泡
                this.deleteWeeklyFood(group.food);
            });
            
            weeklyFoodsContainer.appendChild(weeklyFoodItem);
        });
    }
    
    // 清空历史
    async clearHistory() {
        if (confirm('确定要清空所有历史记录吗？')) {
            const success = await ServerApi.clearHistory();
            if (success) {
                this.history = [];
                history = []; // 更新全局变量
                this.renderHistory();
            }
        }
    }
    
    // 清空一周内已选食物
    async clearWeeklyFoods() {
        if (confirm('确定要清空一周内已选食物记录吗？')) {
            const success = await ServerApi.clearWeeklyFoods();
            if (success) {
                this.weeklyFoods = [];
                weeklyFoods = []; // 更新全局变量
                this.renderWeeklyFoods();
            }
        }
    }
    
    // 删除特定的周食物
    async deleteWeeklyFood(foodName) {
        if (confirm(`确定要删除"${foodName}"这个食物的所有记录吗？`)) {
            const success = await ServerApi.deleteWeeklyFood(foodName);
            if (success) {
                // 从本地列表中删除
                this.weeklyFoods = this.weeklyFoods.filter(item => item.food !== foodName);
                weeklyFoods = this.weeklyFoods; // 更新全局变量
                this.renderWeeklyFoods();
            }
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
    
    // 初始化转盘
    const foodWheel = new FoodWheel(wheel, foods);
    
    // 初始化 UI 管理
    const ui = new UIManager(foodWheel);
    
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
        foodWheel.spin(async (result) => {
            resultDiv.textContent = `选中：${result}`;
            await ui.addHistory(result);
        }, weeklyFoods);
    });
    
    // 初始调整尺寸
    resizeWheel();
    
    // 监听窗口大小变化
    window.addEventListener('resize', resizeWheel);
});
