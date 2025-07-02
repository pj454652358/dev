namespace LunchWheel.Models
{
    public class WeeklyFood
    {
        public int Id { get; set; }
        public required string Food { get; set; }
        public DateTime Date { get; set; } = DateTime.Now;
        public string? UserId { get; set; } // 用于支持多用户的场景
    }
}
