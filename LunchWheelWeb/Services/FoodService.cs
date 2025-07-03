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

        public async Task<(bool success, string message)> AddFoodAsync(Food food)
        {
            // 验证食物名称不为空
            if (string.IsNullOrWhiteSpace(food.Name))
            {
                return (false, "食物名称不能为空");
            }
            
            // 验证食物名称不重复
            bool exists = await _context.Foods.AnyAsync(f => f.Name == food.Name);
            if (exists)
            {
                return (false, "此食物已存在，不能重复添加");
            }
            
            try
            {
                _context.Foods.Add(food);
                await _context.SaveChangesAsync();
                return (true, "添加成功");
            }
            catch (Exception ex)
            {
                return (false, $"添加失败：{ex.Message}");
            }
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
            try
            {
                // 获取当前所有食物
                var allFoods = await _context.Foods
                    .Where(f => string.IsNullOrEmpty(userId) || f.UserId == userId || f.UserId == null)
                    .ToListAsync();
                
                // 删除所有食物
                _context.Foods.RemoveRange(allFoods);
                await _context.SaveChangesAsync();
                
                // 重新添加默认食物
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
                
                // 返回新的默认食物列表
                return defaultFoods.ToList();
            }
            catch (Exception ex)
            {
                // 记录错误并返回空列表
                Console.WriteLine($"重置默认食物时出错: {ex.Message}");
                return new List<Food>();
            }
        }

        // 随机选择食物，避开一周内已选择的食物
        public async Task<(string food, bool isRepeat)> GetRandomFoodAsync(string? lastSelectedFood = null, string? userId = null)
        {
            // 获取所有食物
            var allFoods = await GetAllFoodsAsync(userId);
            if (allFoods == null || allFoods.Count == 0)
            {
                throw new InvalidOperationException("没有可用的食物选项");
            }
            
            // 获取一周内已选择的食物
            var oneWeekAgo = DateTime.Now.AddDays(-7);
            var weeklyFoods = await _context.WeeklyFoods
                .Where(w => w.Date >= oneWeekAgo && (string.IsNullOrEmpty(userId) || w.UserId == userId))
                .ToListAsync();
                
            var recentFoodNames = weeklyFoods.Select(w => w.Food).ToHashSet();
            
            // 过滤出一周内未选择的食物
            var availableFoods = allFoods
                .Where(f => !recentFoodNames.Contains(f.Name))
                .ToList();
                
            // 如果没有未选择的食物，则使用所有食物，但避开上次选择的食物
            bool isRepeat = false;
            if (availableFoods.Count == 0)
            {
                isRepeat = true;
                availableFoods = allFoods;
                
                // 如果只有一种食物，没有选择的余地，直接返回
                if (availableFoods.Count == 1)
                {
                    return (availableFoods[0].Name, isRepeat);
                }
                
                // 如果有多种食物，避开上次选择的
                if (!string.IsNullOrEmpty(lastSelectedFood))
                {
                    availableFoods = availableFoods
                        .Where(f => f.Name != lastSelectedFood)
                        .ToList();
                        
                    // 如果过滤后没有食物（理论上不会发生），回退使用所有食物
                    if (availableFoods.Count == 0)
                    {
                        availableFoods = allFoods;
                    }
                }
            }
            
            // 随机选择一个食物
            var random = new Random();
            var randomIndex = random.Next(availableFoods.Count);
            return (availableFoods[randomIndex].Name, isRepeat);
        }
    }
}
