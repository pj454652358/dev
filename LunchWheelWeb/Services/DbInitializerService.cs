using LunchWheelWeb.Data;
using LunchWheelWeb.Models;
using Microsoft.EntityFrameworkCore;

namespace LunchWheelWeb.Services
{
    public class DbInitializerService
    {
        private readonly LunchWheelDbContext _context;
        private readonly ILogger<DbInitializerService> _logger;

        public DbInitializerService(
            LunchWheelDbContext context,
            ILogger<DbInitializerService> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task InitializeAsync()
        {
            try
            {
                // 确保数据库已创建
                await _context.Database.EnsureCreatedAsync();

                // 检查是否已有食物数据
                if (!await _context.Foods.AnyAsync())
                {
                    // 添加默认食物
                    var defaultFoods = new[]
                    {
                        new Food { Name = "米饭套餐", IsDefault = true },
                        new Food { Name = "面条", IsDefault = true },
                        new Food { Name = "麻辣烫", IsDefault = true },
                        new Food { Name = "沙县小吃", IsDefault = true },
                        new Food { Name = "快餐", IsDefault = true },
                        new Food { Name = "自助餐", IsDefault = true },
                        new Food { Name = "火锅", IsDefault = true },
                        new Food { Name = "烧烤", IsDefault = true },
                        new Food { Name = "汉堡", IsDefault = true },
                        new Food { Name = "寿司", IsDefault = true },
                        new Food { Name = "炸鸡", IsDefault = true },
                        new Food { Name = "沙拉", IsDefault = true }
                    };

                    await _context.Foods.AddRangeAsync(defaultFoods);
                    await _context.SaveChangesAsync();
                    _logger.LogInformation("已添加默认食物数据");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "初始化数据库时出错");
                throw;
            }
        }
    }
}
