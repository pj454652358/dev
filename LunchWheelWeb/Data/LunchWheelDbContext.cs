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
            // 配置默认食物
            var defaultFoods = new[]
            {
                new Food { Id = 1, Name = "米饭套餐", IsDefault = true },
                new Food { Id = 2, Name = "面条", IsDefault = true },
                new Food { Id = 3, Name = "麻辣烫", IsDefault = true },
                new Food { Id = 4, Name = "沙县小吃", IsDefault = true },
                new Food { Id = 5, Name = "快餐", IsDefault = true },
                new Food { Id = 6, Name = "自助餐", IsDefault = true },
                new Food { Id = 7, Name = "火锅", IsDefault = true },
                new Food { Id = 8, Name = "烧烤", IsDefault = true },
                new Food { Id = 9, Name = "汉堡", IsDefault = true },
                new Food { Id = 10, Name = "寿司", IsDefault = true },
                new Food { Id = 11, Name = "炸鸡", IsDefault = true },
                new Food { Id = 12, Name = "沙拉", IsDefault = true }
            };

            modelBuilder.Entity<Food>().HasData(defaultFoods);
        }
    }
}
