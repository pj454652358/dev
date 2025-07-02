namespace LunchWheel.Models
{
    public class Food
    {
        public int Id { get; set; }
        public required string Name { get; set; }
        public bool IsDefault { get; set; }
        public string? UserId { get; set; } // 用于支持多用户的场景
    }
}
