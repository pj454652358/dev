// 可自定义食物列表
const foods = [
    '米饭套餐', '面条', '麻辣烫', '沙县小吃', '快餐', '自助餐', '火锅', '烧烤', '汉堡', '寿司', '炸鸡', '沙拉'
];

const colors = [
    '#f39c12', '#e67e22', '#e74c3c', '#9b59b6', '#2980b9', '#16a085',
    '#27ae60', '#2ecc71', '#1abc9c', '#3498db', '#8e44ad', '#d35400'
];

const wheel = document.getElementById('wheel');
const ctx = wheel.getContext('2d');
const spinBtn = document.getElementById('spin');
const resultDiv = document.getElementById('result');
const WHEEL_RADIUS = 200;

const num = foods.length;
const arc = 2 * Math.PI / num;
// 让指针一开始就指向第一个食物的正中间（指针在270度方向）
let angle = 270 - (360 / num) / 2;
let spinning = false;

function drawWheel() {
    ctx.save();
    ctx.translate(WHEEL_RADIUS, WHEEL_RADIUS);
    ctx.rotate((angle % 360) * Math.PI / 180);
    ctx.translate(-WHEEL_RADIUS, -WHEEL_RADIUS);
    for (let i = 0; i < num; i++) {
        ctx.beginPath();
        ctx.moveTo(WHEEL_RADIUS, WHEEL_RADIUS);
        ctx.arc(WHEEL_RADIUS, WHEEL_RADIUS, WHEEL_RADIUS, i * arc, (i + 1) * arc);
        ctx.closePath();
        ctx.fillStyle = colors[i % colors.length];
        ctx.fill();
        ctx.save();
        ctx.translate(WHEEL_RADIUS, WHEEL_RADIUS);
        ctx.rotate((i + 0.5) * arc);
        ctx.textAlign = 'right';
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 20px sans-serif';
        ctx.fillText(foods[i], WHEEL_RADIUS - 20, 10);
        ctx.restore();
    }
    ctx.restore();
}

drawWheel();

function spin() {
    if (spinning) return;
    spinning = true;
    resultDiv.textContent = '';
    // 每次都从当前角度基础上增加一个新的随机旋转量
    let extraSpin = Math.random() * 360 + 360 * 5; // 至少转5圈
    let start = angle;
    let target = angle + extraSpin;
    let duration = 4000; // ms
    let startTime = null;

    function animateWheel(ts) {
        if (!startTime) startTime = ts;
        let elapsed = ts - startTime;
        let progress = Math.min(elapsed / duration, 1);
        // ease out
        let currentAngle = start + (target - start) * (1 - Math.pow(1 - progress, 3));
        angle = currentAngle;
        ctx.clearRect(0, 0, 400, 400);
        drawWheel();
        if (progress < 1) {
            requestAnimationFrame(animateWheel);
        } else {
            // 归一化角度，防止无限增大
            angle = angle % 360;
            spinning = false;
            showResult();
        }
    }
    requestAnimationFrame(animateWheel);
}

function showResult() {
    // 指针在正上方，计算当前角度对应的食物
    let deg = (angle % 360 + 360) % 360;
    // 计算指针（正上方0度）落在哪个扇区
    let sectorAngle = 360 / num;
    // 由于canvas的0度在3点钟方向，且顺时针，需修正90度
    let pointerDeg = (270 - deg + 360) % 360;
    let idx = Math.floor(pointerDeg / sectorAngle) % num;
    resultDiv.textContent = `选中：${foods[idx]}`;
}

spinBtn.addEventListener('click', spin);
