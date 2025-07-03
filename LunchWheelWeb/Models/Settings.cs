using System;

namespace LunchWheelWeb.Models
{
    public class Settings
    {
        public int Id { get; set; }
        public string? UserId { get; set; }
        public string Title { get; set; } = "午餐吃什么？";
        public string ItemName { get; set; } = "食物";
        public string Theme { get; set; } = "food"; // 可以扩展为不同主题
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
