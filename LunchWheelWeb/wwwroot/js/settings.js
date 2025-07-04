// 简单的设置切换函数
function toggleSettings(id) {
    console.log(`切换设置: ${id}`);
    
    const content = document.getElementById(id);
    const button = document.querySelector(`button[onclick="toggleSettings('${id}')"]`);
    
    if (!content) {
        console.error(`找不到元素: #${id}`);
        return;
    }
    
    // 切换显示/隐藏状态
    if (content.style.display === "none" || content.style.display === "") {
        // 显示内容
        content.style.display = "block";
        if (button) button.classList.add("active");
    } else {
        // 隐藏内容
        content.style.display = "none";
        if (button) button.classList.remove("active");
    }
}

// 页面加载时初始化
document.addEventListener("DOMContentLoaded", function() {
    console.log("设置页面加载完成");
});
