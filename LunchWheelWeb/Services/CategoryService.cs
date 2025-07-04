using LunchWheelWeb.Data;
using LunchWheelWeb.Models;
using Microsoft.EntityFrameworkCore;

namespace LunchWheelWeb.Services
{
    public class CategoryService
    {
        private readonly LunchWheelDbContext _context;

        public CategoryService(LunchWheelDbContext context)
        {
            _context = context;
        }

        public async Task<List<Category>> GetAllCategoriesAsync(string? userId = null)
        {
            return await _context.Categories
                .Where(c => string.IsNullOrEmpty(userId) || c.UserId == userId || c.UserId == null)
                .OrderBy(c => c.Name)
                .ToListAsync();
        }

        public async Task<Category?> GetCategoryAsync(int id)
        {
            return await _context.Categories
                .Include(c => c.Foods)
                .FirstOrDefaultAsync(c => c.Id == id);
        }

        public async Task<Category?> GetCategoryByNameAsync(string name, string? userId = null)
        {
            return await _context.Categories
                .FirstOrDefaultAsync(c => c.Name == name && 
                    (string.IsNullOrEmpty(userId) || c.UserId == userId || c.UserId == null));
        }

        public async Task<(bool success, string message, Category? category)> AddCategoryAsync(Category category)
        {
            // 验证分类名称不为空
            if (string.IsNullOrWhiteSpace(category.Name))
            {
                return (false, "分类名称不能为空", null);
            }
            
            // 验证分类名称不重复
            bool exists = await _context.Categories.AnyAsync(c => 
                c.Name == category.Name && 
                (string.IsNullOrEmpty(category.UserId) || c.UserId == category.UserId || c.UserId == null));
                
            if (exists)
            {
                return (false, "此分类已存在，不能重复添加", null);
            }
            
            try
            {
                _context.Categories.Add(category);
                await _context.SaveChangesAsync();
                return (true, "添加成功", category);
            }
            catch (Exception ex)
            {
                return (false, $"添加失败：{ex.Message}", null);
            }
        }

        public async Task<(bool success, string message)> UpdateCategoryAsync(Category category)
        {
            if (category == null || category.Id <= 0)
            {
                return (false, "无效的分类数据");
            }
            
            try
            {
                _context.Entry(category).State = EntityState.Modified;
                await _context.SaveChangesAsync();
                return (true, "更新成功");
            }
            catch (Exception ex)
            {
                return (false, $"更新失败：{ex.Message}");
            }
        }

        public async Task<(bool success, string message)> DeleteCategoryAsync(int id)
        {
            var category = await _context.Categories
                .Include(c => c.Foods)
                .FirstOrDefaultAsync(c => c.Id == id);
                
            if (category == null)
            {
                return (false, "分类不存在");
            }
            
            try
            {
                // 将此分类下的所有食物的分类设为null
                foreach (var food in category.Foods)
                {
                    food.CategoryId = null;
                    food.Category = null;
                }
                
                _context.Categories.Remove(category);
                await _context.SaveChangesAsync();
                return (true, "删除成功");
            }
            catch (Exception ex)
            {
                return (false, $"删除失败：{ex.Message}");
            }
        }

        public async Task<List<Category>> ResetToDefaultsAsync(string? userId = null)
        {
            try
            {
                // 获取当前所有分类
                var allCategories = await _context.Categories
                    .Where(c => string.IsNullOrEmpty(userId) || c.UserId == userId || c.UserId == null)
                    .ToListAsync();
                
                // 删除所有分类
                _context.Categories.RemoveRange(allCategories);
                await _context.SaveChangesAsync();
                
                // 重新添加默认分类
                var defaultCategories = new[]
                {
                    new Category { Name = "午餐", Description = "中午用餐选择", IconName = "lunch", Color = "#e67e22", IsDefault = true },
                    new Category { Name = "晚餐", Description = "晚上用餐选择", IconName = "dinner", Color = "#3498db", IsDefault = true },
                    new Category { Name = "休闲活动", Description = "休闲时间活动", IconName = "activity", Color = "#9b59b6", IsDefault = true },
                    new Category { Name = "旅游地点", Description = "旅游目的地", IconName = "travel", Color = "#27ae60", IsDefault = true }
                };
                
                await _context.Categories.AddRangeAsync(defaultCategories);
                await _context.SaveChangesAsync();
                
                // 返回新的默认分类列表
                return defaultCategories.ToList();
            }
            catch (Exception ex)
            {
                // 记录错误并返回空列表
                Console.WriteLine($"重置默认分类时出错: {ex.Message}");
                return new List<Category>();
            }
        }
    }
}
