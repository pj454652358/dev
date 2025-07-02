namespace LunchWheelWeb.Models
{
    public class History
    {
        public int Id { get; set; }
        public required string Food { get; set; }
        public DateTime Time { get; set; } = DateTime.Now;
        public string? UserId { get; set; }
    }
}
