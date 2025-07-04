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

        public async Task<List<Food>> GetAllFoodsAsync(string? userId = null, int? categoryId = null)
        {
            var query = _context.Foods
                .Where(f => string.IsNullOrEmpty(userId) || f.UserId == userId || f.UserId == null);
                
            // 如果指定了分类，则筛选该分类下的食物
            if (categoryId.HasValue)
            {
                query = query.Where(f => f.CategoryId == categoryId);
            }
            
            return await query
                .Include(f => f.Category)
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
            bool exists = await _context.Foods.AnyAsync(f => f.Name == food.Name &&
                (string.IsNullOrEmpty(food.UserId) || f.UserId == food.UserId || f.UserId == null));
                
            if (exists)
            {
                return (false, "此选项已存在，不能重复添加");
            }
            
            try
            {
                // 验证分类是否存在
                if (food.CategoryId.HasValue)
                {
                    var category = await _context.Categories.FindAsync(food.CategoryId);
                    if (category == null)
                    {
                        return (false, "所选分类不存在");
                    }
                }
                
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
                
                // 获取或创建默认分类
                var lunchCategory = await _context.Categories.FirstOrDefaultAsync(c => c.Name == "午餐" && c.IsDefault);
                var dinnerCategory = await _context.Categories.FirstOrDefaultAsync(c => c.Name == "晚餐" && c.IsDefault);
                var activityCategory = await _context.Categories.FirstOrDefaultAsync(c => c.Name == "休闲活动" && c.IsDefault);
                
                if (lunchCategory == null || dinnerCategory == null || activityCategory == null)
                {
                    // 如果默认分类不存在，先创建默认分类
                    var categoryService = new CategoryService(_context);
                    await categoryService.ResetToDefaultsAsync(userId);
                    
                    // 重新获取分类
                    lunchCategory = await _context.Categories.FirstOrDefaultAsync(c => c.Name == "午餐" && c.IsDefault);
                    dinnerCategory = await _context.Categories.FirstOrDefaultAsync(c => c.Name == "晚餐" && c.IsDefault);
                    activityCategory = await _context.Categories.FirstOrDefaultAsync(c => c.Name == "休闲活动" && c.IsDefault);
                }
                
                // 重新添加默认食物，添加分类和权重
                var defaultFoods = new List<Food>
                {
                    // 午餐选项
                    new Food { Name = "米饭套餐", IsDefault = true, CategoryId = lunchCategory?.Id, Weight = 2 },
                    new Food { Name = "面条", IsDefault = true, CategoryId = lunchCategory?.Id, Weight = 2 },
                    new Food { Name = "麻辣烫", IsDefault = true, CategoryId = lunchCategory?.Id, Weight = 1 },
                    new Food { Name = "沙县小吃", IsDefault = true, CategoryId = lunchCategory?.Id, Weight = 1 },
                    new Food { Name = "快餐", IsDefault = true, CategoryId = lunchCategory?.Id, Weight = 3 },
                    new Food { Name = "自助餐", IsDefault = true, CategoryId = lunchCategory?.Id, Weight = 1 },
                    
                    // 晚餐选项
                    new Food { Name = "火锅", IsDefault = true, CategoryId = dinnerCategory?.Id, Weight = 2, IsFavorite = true },
                    new Food { Name = "烧烤", IsDefault = true, CategoryId = dinnerCategory?.Id, Weight = 2 },
                    new Food { Name = "汉堡", IsDefault = true, CategoryId = dinnerCategory?.Id, Weight = 1 },
                    new Food { Name = "寿司", IsDefault = true, CategoryId = dinnerCategory?.Id, Weight = 1 },
                    new Food { Name = "炸鸡", IsDefault = true, CategoryId = dinnerCategory?.Id, Weight = 2 },
                    new Food { Name = "沙拉", IsDefault = true, CategoryId = dinnerCategory?.Id, Weight = 1 },
                    
                    // 活动选项
                    new Food { Name = "看电影", IsDefault = true, CategoryId = activityCategory?.Id, Weight = 2 },
                    new Food { Name = "打游戏", IsDefault = true, CategoryId = activityCategory?.Id, Weight = 3, IsFavorite = true },
                    new Food { Name = "听音乐", IsDefault = true, CategoryId = activityCategory?.Id, Weight = 1 },
                    new Food { Name = "阅读", IsDefault = true, CategoryId = activityCategory?.Id, Weight = 1 }
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

        // 随机选择食物，考虑权重和时间规则
        public async Task<(string foodName, bool isRepeat, string? message)> GetRandomFoodAsync(string? userId = null, int? categoryId = null, string? lastSelected = null)
        {
            // 获取所有食物
            var allFoods = await GetAllFoodsAsync(userId, categoryId);
            if (allFoods == null || allFoods.Count == 0)
            {
                throw new InvalidOperationException("没有可用的选项");
            }
            
            // 过滤出当前可用的食物
            var availableFoods = allFoods.Where(f => f.IsAvailableNow()).ToList();
            
            // 如果没有可用的食物（由于时间限制或排除规则），则使用所有食物
            if (availableFoods.Count == 0)
            {
                availableFoods = allFoods;
                // 记录没有可用选项的消息
                if (allFoods.Any(f => !f.IsAvailableNow() && f.LastSelectedAt.HasValue && f.ExclusionHours > 0))
                {
                    return (GetWeightedRandomFood(allFoods), true, "所有选项都在排除时间内，已重新全部纳入考虑范围");
                }
            }
            
            // 使用权重选择食物
            return (GetWeightedRandomFood(availableFoods), false, null);
        }
        
        // 根据权重随机选择一个食物
        private string GetWeightedRandomFood(List<Food> foods)
        {
            // 计算总权重
            int totalWeight = 0;
            
            // 计算基础权重总和
            foreach (var food in foods)
            {
                int weight = food.Weight;
                
                // 喜爱的食物权重加倍
                if (food.IsFavorite)
                {
                    weight *= 2;
                }
                
                totalWeight += weight;
            }
            
            // 如果总权重为0，则每个食物平等对待
            if (totalWeight == 0)
            {
                var random = new Random();
                return foods[random.Next(foods.Count)].Name;
            }
            
            // 根据权重随机选择
            var r = new Random().Next(totalWeight);
            int weightSum = 0;
            
            foreach (var food in foods)
            {
                int effectiveWeight = food.Weight * (food.IsFavorite ? 2 : 1);
                weightSum += effectiveWeight;
                
                if (r < weightSum)
                {
                    // 更新最近选择时间
                    food.LastSelectedAt = DateTime.Now;
                    _context.SaveChangesAsync().GetAwaiter().GetResult();
                    
                    return food.Name;
                }
            }
            
            // 理论上不会执行到这里，但为了编译通过
            return foods[0].Name;
        }
    }
}
