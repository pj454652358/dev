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
let settings = initialSettings || {
    title: "午餐吃什么？",
    itemName: "食物",
    theme: "food"
};

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
    async spin(callback) {
        if (this.spinning) return;
        if (this.foods.length === 0) {
            alert('请先添加食物选项');
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
            // 获取后端返回的随机食物
            const result = await ServerApi.spinWheel(lastSelectedFood);
            
            if (!result) {
                this.spinning = false;
                return;
            }
            
            // 如果所有食物都已选择过，可以显示提示
            if (result.isRepeat && result.message) {
                console.log(result.message);
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
    
    // 周食物相关方法已移除
    
    // 随机选择食物
    static async spinWheel(lastSelected = null) {
        try {
            let url = '/api/LunchWheel/spin';
            if (lastSelected) {
                url += `?lastSelected=${encodeURIComponent(lastSelected)}`;
            }
            
            const response = await fetch(url);
            if (!response.ok) throw new Error('转盘操作失败');
            return await response.json();
        } catch (error) {
            console.error('转盘操作错误:', error);
            ServerApi.showMessage('error', '转盘操作失败');
            return null;
        }
    }
    
    // 获取设置
    static async getSettings() {
        try {
            const response = await fetch('/api/LunchWheel/settings');
            if (!response.ok) throw new Error('获取设置失败');
            return await response.json();
        } catch (error) {
            console.error('获取设置错误:', error);
            ServerApi.showMessage('error', '获取设置失败');
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
            
            if (!response.ok) throw new Error('更新设置失败');
            
            const result = await response.json();
            ServerApi.showMessage('success', '设置已更新');
            return result;
        } catch (error) {
            console.error('更新设置错误:', error);
            ServerApi.showMessage('error', '更新设置失败');
            return null;
        }
    }
    
    // 重置设置
    static async resetSettings() {
        try {
            const response = await fetch('/api/LunchWheel/settings/reset', {
                method: 'POST'
            });
            
            if (!response.ok) throw new Error('重置设置失败');
            
            const result = await response.json();
            ServerApi.showMessage('success', '设置已重置为默认');
            return result;
        } catch (error) {
            console.error('重置设置错误:', error);
            ServerApi.showMessage('error', '重置设置失败');
            return null;
        }
    }
}

// UI 管理类
class UIManager {
    constructor(foodWheel) {
        this.foodWheel = foodWheel;
        this.foods = [];
        this.history = [];
        this.settings = settings; // 使用全局设置
        
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
        this.wheelTitle = document.getElementById('wheel-title');
        this.wheelNameInput = document.getElementById('wheel-name');
        this.itemNameInput = document.getElementById('item-name');
        this.customOptionsTitle = document.getElementById('custom-options-title');
        this.itemTypeTexts = document.querySelectorAll('[id^="item-type-text"]');
        this.settingsSection = document.querySelector('.settings-section');
        this.settingsSectionHeader = document.querySelector('.settings-section-header');

        console.log('初始化设置:', this.settings);
        
        // 初始化
        this.init();
    }
    
    // 初始化
    async init() {
        // 加载数据
        this.foods = foods;
        this.history = history;
        
        // 更新 UI
        this.updateFoodWheel();
        this.renderFoodList();
        this.renderHistory();
        this.applySettings();
        
        // 绑定事件
        this.bindEvents();
    }
    
    // 绑定事件
    bindEvents() {
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
        
        // 设置相关
        this.wheelNameInput.addEventListener('input', () => this.updateWheelTitle());
        this.itemNameInput.addEventListener('input', () => this.updateItemName());
        this.itemTypeTexts.forEach((element) => {
            element.addEventListener('input', () => this.updateItemType(element));
        });
        
        // 设置区域折叠/展开
        if (this.settingsSectionHeader) {
            this.settingsSectionHeader.addEventListener('click', () => this.toggleSettingsSection());
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
    
    // 重置为默认
    async resetToDefault() {
        // 重置食物列表
        try {
            const defaultFoods = await ServerApi.resetToDefaultFoods();
            
            if (defaultFoods) {
                this.foods = defaultFoods;
                this.foodWheel.foods = defaultFoods;
                this.foodWheel.initializeAngle();
                this.foodWheel.draw();
                this.renderFoodList();
                ServerApi.showMessage('success', '已恢复默认食物');
            }
        } catch (error) {
            console.error('重置默认食物错误:', error);
            ServerApi.showMessage('error', '重置默认食物失败');
        }
        
        // 重置设置
        try {
            const defaultSettings = await ServerApi.resetSettings();
            
            if (defaultSettings) {
                this.settings = defaultSettings;
                this.applySettings();
                ServerApi.showMessage('success', '已恢复默认设置');
            }
        } catch (error) {
            console.error('重置设置错误:', error);
            ServerApi.showMessage('error', '重置设置失败');
        }
    }
    
    // 保存设置
    async saveSettings() {
        const settingsData = {
            title: this.wheelNameInput.value.trim(),
            itemName: this.itemNameInput.value.trim(),
            theme: "food" // 默认主题
        };
        
        // 前端简单验证
        if (!settingsData.title) {
            return ServerApi.showMessage('error', '标题不能为空');
        }
        
        if (!settingsData.itemName) {
            return ServerApi.showMessage('error', '项目名称不能为空');
        }
        
        // 更新全局设置变量
        settings = settingsData;
        
        // 应用设置到UI
        this.settings = settingsData;
        this.applySettings();
        
        // 调用API保存
        const result = await ServerApi.updateSettings(settingsData);
        if (result) {
            ServerApi.showMessage('success', '设置已保存！');
        } else {
            ServerApi.showMessage('error', '设置保存失败！');
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
        // 重新加载历史记录
        const newHistory = await ServerApi.getHistory();
        
        if (newHistory) {
            this.history = newHistory;
            history = newHistory; // 更新全局变量
        }
        
        this.renderHistory();
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
    
    // 应用设置到UI
    applySettings() {
        console.log('应用设置到UI', this.settings);
        
        // 更新页面标题
        document.title = this.settings.title || "决策转盘";
        
        // 更新转盘标题
        if (this.wheelTitle) {
            this.wheelTitle.textContent = this.settings.title || "午餐吃什么？";
        }
        
        // 更新设置表单
        if (this.wheelNameInput) {
            this.wheelNameInput.value = this.settings.title || "午餐吃什么？";
        }
        
        if (this.itemNameInput) {
            this.itemNameInput.value = this.settings.itemName || "食物";
        }
        
        // 更新自定义选项标题
        if (this.customOptionsTitle) {
            this.customOptionsTitle.textContent = `自定义${this.settings.itemName || "选项"}`;
        }
        
        // 更新选项名称显示
        if (this.itemTypeTexts) {
            this.itemTypeTexts.forEach(element => {
                element.textContent = this.settings.itemName || "选项";
            });
        }
        
        // 更新输入框提示
        if (this.newFoodInput) {
            this.newFoodInput.placeholder = `添加新${this.settings.itemName || "选项"}...`;
        }
    }
    
    // 更新转盘标题
    updateWheelTitle() {
        const title = this.wheelNameInput.value.trim();
        this.settings.title = title;
        this.wheelTitle.textContent = title || "决策转盘";
        document.title = title || "决策转盘";
    }
    
    // 更新选项名称
    updateItemName() {
        const itemName = this.itemNameInput.value.trim();
        this.settings.itemName = itemName;
        
        // 更新相关文本
        this.customOptionsTitle.textContent = `自定义${itemName || "选项"}`;
        this.itemTypeTexts.forEach(element => {
            element.textContent = itemName || "选项";
        });
        
        // 更新输入框提示
        this.newFoodInput.placeholder = `添加新${itemName || "选项"}...`;
    }
    
    // 更新项目类型
    updateItemType(input) {
        const typeIndex = Array.from(this.itemTypeTexts).indexOf(input);
        if (typeIndex === -1) return;
        
        // 更新对应的设置项
        settings[`itemType${typeIndex + 1}`] = input.value.trim();
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
    
    // 切换设置区域的折叠/展开状态
    toggleSettingsSection() {
        if (this.settingsSection) {
            this.settingsSection.classList.toggle('collapsed');
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
        const itemName = settings?.itemName || "选项";
        resultDiv.textContent = `指针指向${itemName}：${initialFood}`;
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
            const itemName = settings?.itemName || "选项";
            alert(`请先添加${itemName}`);
            return;
        }
        
        // 检查是否所有食物都已在一周内选择过的逻辑已移至后端
        // 后端会返回是否所有食物都已选择过的标志
        
        resultDiv.textContent = '';
        foodWheel.spin((result) => {
            const itemName = settings?.itemName || "选项";
            resultDiv.textContent = `选中${itemName}：${result}`;
            // 历史记录已由后端API添加，不需要再次添加
            // 只需刷新UI
            ui.reloadData();
        });
    });
    
    // 初始调整尺寸
    resizeWheel();
    
    // 监听窗口大小变化
    window.addEventListener('resize', resizeWheel);
});
