namespace LunchWheelWeb.Models
{
    public class Food
    {
        public int Id { get; set; }
        public required string Name { get; set; }
        public bool IsDefault { get; set; }
        public string? UserId { get; set; }
        
        // 新增字段
        public int Weight { get; set; } = 1; // 默认权重为1
        public bool IsFavorite { get; set; } = false; // 是否标记为喜爱
        public DateTime CreatedAt { get; set; } = DateTime.Now;
        public DateTime? LastSelectedAt { get; set; } // 最近一次被选中的时间
        
        // 可用时间范围（null表示无限制）
        public TimeOnly? AvailableFromTime { get; set; }
        public TimeOnly? AvailableToTime { get; set; }
        
        // 排除规则：被选中后多少小时内不再被选中（0表示无限制）
        public int ExclusionHours { get; set; } = 0;
        
        // 分类关联
        public int? CategoryId { get; set; }
        public virtual Category? Category { get; set; }
        
        // 判断当前选项是否可用
        public bool IsAvailableNow()
        {
            // 检查最近选择的排除时间
            if (LastSelectedAt.HasValue && ExclusionHours > 0)
            {
                var exclusionEndTime = LastSelectedAt.Value.AddHours(ExclusionHours);
                if (DateTime.Now < exclusionEndTime)
                {
                    return false; // 在排除时间内，不可用
                }
            }
            
            // 检查时间限制
            if (AvailableFromTime.HasValue && AvailableToTime.HasValue)
            {
                var now = TimeOnly.FromDateTime(DateTime.Now);
                if (AvailableFromTime.Value <= AvailableToTime.Value) 
                {
                    // 普通时间范围 (例如: 9:00 - 17:00)
                    return now >= AvailableFromTime.Value && now <= AvailableToTime.Value;
                }
                else 
                {
                    // 跨日时间范围 (例如: 22:00 - 6:00)
                    return now >= AvailableFromTime.Value || now <= AvailableToTime.Value;
                }
            }
            
            return true; // 无限制，始终可用
        }
    }
}
