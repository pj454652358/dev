using LunchWheelWeb.Data;
using LunchWheelWeb.Models;
using Microsoft.EntityFrameworkCore;

namespace LunchWheelWeb.Services
{
    public class WeeklyFoodService
    {
        private readonly LunchWheelDbContext _context;

        public WeeklyFoodService(LunchWheelDbContext context)
        {
            _context = context;
        }

        public async Task<List<WeeklyFood>> GetWeeklyFoodsAsync(string? userId = null)
        {
            // 获取一周前的日期
            var oneWeekAgo = DateTime.Now.AddDays(-7);
            
            // 返回一周内的食物
            return await _context.WeeklyFoods
                .Where(w => w.Date >= oneWeekAgo && (string.IsNullOrEmpty(userId) || w.UserId == userId))
                .OrderByDescending(w => w.Date)
                .ToListAsync();
        }

        public async Task AddWeeklyFoodAsync(WeeklyFood weeklyFood)
        {
            _context.WeeklyFoods.Add(weeklyFood);
            await _context.SaveChangesAsync();
        }

        public async Task ClearWeeklyFoodsAsync(string? userId = null)
        {
            var weeklyFoods = await _context.WeeklyFoods
                .Where(w => string.IsNullOrEmpty(userId) || w.UserId == userId)
                .ToListAsync();
                
            _context.WeeklyFoods.RemoveRange(weeklyFoods);
            await _context.SaveChangesAsync();
        }
        
        // 删除指定食物的所有记录
        public async Task DeleteWeeklyFoodByNameAsync(string foodName)
        {
            var weeklyFoods = await _context.WeeklyFoods
                .Where(w => w.Food == foodName)
                .ToListAsync();
                
            _context.WeeklyFoods.RemoveRange(weeklyFoods);
            await _context.SaveChangesAsync();
        }
    }
}
