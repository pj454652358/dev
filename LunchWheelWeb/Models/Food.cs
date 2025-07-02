namespace LunchWheelWeb.Models
{
    public class Food
    {
        public int Id { get; set; }
        public required string Name { get; set; }
        public bool IsDefault { get; set; }
        public string? UserId { get; set; }
    }
}
