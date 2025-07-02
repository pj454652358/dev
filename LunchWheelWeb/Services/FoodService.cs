using LunchWheelWeb.Data;
using LunchWheelWeb.Models;
using Microsoft.EntityFrameworkCore;

namespace LunchWheelWeb.Services
{
    public class FoodService
    {
        private readonly LunchWheelDbContext _context;

        public FoodService(LunchWheelDbContext context)
        {
            _context = context;
        }

        public async Task<List<Food>> GetAllFoodsAsync(string? userId = null)
        {
            return await _context.Foods
                .Where(f => string.IsNullOrEmpty(userId) || f.UserId == userId || f.UserId == null)
                .ToListAsync();
        }

        public async Task<Food?> GetFoodAsync(int id)
        {
            return await _context.Foods.FindAsync(id);
        }

        public async Task AddFoodAsync(Food food)
        {
            _context.Foods.Add(food);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateFoodAsync(Food food)
        {
            _context.Entry(food).State = EntityState.Modified;
            await _context.SaveChangesAsync();
        }

        public async Task DeleteFoodAsync(int id)
        {
            var food = await _context.Foods.FindAsync(id);
            if (food != null)
            {
                _context.Foods.Remove(food);
                await _context.SaveChangesAsync();
            }
        }

        public async Task<List<Food>> ResetToDefaultsAsync(string? userId = null)
        {
            // 获取当前非默认食物
            var nonDefaultFoods = await _context.Foods
                .Where(f => !f.IsDefault && (string.IsNullOrEmpty(userId) || f.UserId == userId))
                .ToListAsync();
            
            // 删除所有非默认食物
            _context.Foods.RemoveRange(nonDefaultFoods);
            
            await _context.SaveChangesAsync();
            
            // 返回所有食物（默认食物）
            return await _context.Foods
                .Where(f => string.IsNullOrEmpty(userId) || f.UserId == userId || f.UserId == null)
                .ToListAsync();
        }
    }
}
