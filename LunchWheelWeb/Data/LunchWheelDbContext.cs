using Microsoft.EntityFrameworkCore;
using LunchWheelWeb.Models;

namespace LunchWheelWeb.Data
{
    public class LunchWheelDbContext : DbContext
    {
        public LunchWheelDbContext(DbContextOptions<LunchWheelDbContext> options)
            : base(options)
        {
        }

        public DbSet<Food> Foods { get; set; }
        public DbSet<History> History { get; set; }
        public DbSet<WeeklyFood> WeeklyFoods { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // 不在这里配置默认食物，使用DbInitializerService来初始化默认食物
            // 这样可以允许用户删除默认食物而不会在应用重启后自动恢复
            // 只有在用户主动点击"恢复默认"按钮时，默认食物才会被重新添加
        }
    }
}
