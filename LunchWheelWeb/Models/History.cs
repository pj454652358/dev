namespace LunchWheelWeb.Models
{
    public class History
    {
        public int Id { get; set; }
        public required string Food { get; set; }
        public string? CategoryName { get; set; }  // 添加分类名称字段
        public string? CategoryColor { get; set; } // 添加分类颜色字段
        public DateTime Time { get; set; } = DateTime.Now;
        public string? UserId { get; set; }
    }
}
