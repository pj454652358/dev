namespace LunchWheelWeb.Models
{
    public class WeeklyFood
    {
        public int Id { get; set; }
        public required string Food { get; set; }
        public DateTime Date { get; set; } = DateTime.Now;
        public string? UserId { get; set; }
    }
}
