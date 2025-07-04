using System.Collections.Generic;

namespace LunchWheelWeb.Models
{
    public class Category
    {
        public int Id { get; set; }
        public required string Name { get; set; }
        public string? Description { get; set; }
        public string? IconName { get; set; }
        public string? Color { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.Now;
        public string? UserId { get; set; }
        public bool IsDefault { get; set; }
        
        // 关联的选项列表
        public virtual List<Food> Foods { get; set; } = new List<Food>();
    }
}
