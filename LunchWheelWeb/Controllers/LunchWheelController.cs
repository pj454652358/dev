using LunchWheelWeb.Models;
using LunchWheelWeb.Services;
using Microsoft.AspNetCore.Mvc;

namespace LunchWheelWeb.Controllers
{
    // API控制器 - 用于JavaScript的AJAX请求
    [Route("api/[controller]")]
    [ApiController]
    public class LunchWheelController : ControllerBase
    {
        private readonly FoodService _foodService;
        private readonly HistoryService _historyService;
        private readonly SettingsService _settingsService;
        private readonly CategoryService _categoryService;

        public LunchWheelController(
            FoodService foodService, 
            HistoryService historyService, 
            SettingsService settingsService,
            CategoryService categoryService)
        {
            _foodService = foodService;
            _historyService = historyService;
            _settingsService = settingsService;
            _categoryService = categoryService;
        }

        // 获取食物列表
        [HttpGet("foods")]
        public async Task<ActionResult<IEnumerable<string>>> GetFoods(int? categoryId = null)
        {
            var foods = await _foodService.GetAllFoodsAsync(categoryId: categoryId);
            return foods.Select(f => f.Name).ToList();
        }

        // 保存食物列表
        [HttpPost("foods/save")]
        public async Task<ActionResult> SaveFoods([FromBody] List<string> foods)
        {
            try
            {
                if (foods == null)
                {
                    return BadRequest(new { success = false, message = "无效的食物列表数据" });
                }
                
                // 过滤无效的食物名称
                foods = foods.Where(f => !string.IsNullOrWhiteSpace(f)).Select(f => f.Trim()).Distinct().ToList();
                
                // 获取现有食物
                var existingFoods = await _foodService.GetAllFoodsAsync();
                
                // 删除不在新列表中的食物（包括默认食物）
                foreach (var existingFood in existingFoods)
                {
                    if (!foods.Contains(existingFood.Name))
                    {
                        await _foodService.DeleteFoodAsync(existingFood.Id);
                    }
                }
                
                // 添加新食物
                foreach (var food in foods)
                {
                    if (!existingFoods.Any(ef => ef.Name == food))
                    {
                        var result = await _foodService.AddFoodAsync(new Food { Name = food });
                        if (!result.success)
                        {
                            // 记录警告但继续处理其他食物
                            Console.WriteLine($"添加食物 '{food}' 失败: {result.message}");
                        }
                    }
                }
                
                return Ok(new { success = true, message = "食物列表保存成功" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = $"保存食物列表时发生错误: {ex.Message}" });
            }
        }

        // 重置为默认食物
        [HttpPost("foods/reset")]
        public async Task<ActionResult<IEnumerable<string>>> ResetToDefaultFoods()
        {
            var foods = await _foodService.ResetToDefaultsAsync();
            return foods.Select(f => f.Name).ToList();
        }

        // 添加历史记录
        [HttpPost("history")]
        public async Task<ActionResult> AddHistory([FromBody] History history)
        {
            await _historyService.AddHistoryAsync(history);
            return Ok();
        }

        // 获取历史记录
        [HttpGet("history")]
        public async Task<ActionResult<IEnumerable<object>>> GetHistory()
        {
            var history = await _historyService.GetHistoryAsync();
            return history.Select(h => new {
                food = h.Food,
                categoryName = h.CategoryName,
                categoryColor = h.CategoryColor,
                time = h.Time.ToLocalTime().ToString("yyyy-MM-dd HH:mm"),
                saved = true
            }).ToList();
        }

        // 清空历史记录
        [HttpDelete("history")]
        public async Task<ActionResult> ClearHistory()
        {
            await _historyService.ClearHistoryAsync();
            return Ok();
        }

        // 周食物相关API已移除

        // 随机选择食物
        [HttpGet("spin")]
        public async Task<ActionResult<object>> SpinWheel(string? lastSelected = null, int? categoryId = null)
        {
            try
            {
                // 随机选择食物
                var (foodName, isRepeat, message) = await _foodService.GetRandomFoodAsync(categoryId: categoryId, lastSelected: lastSelected);
                
                // 获取选中食物的分类信息
                var allFoods = await _foodService.GetAllFoodsAsync(null, null);
                var foodWithCategory = allFoods.FirstOrDefault(f => f.Name == foodName);
                
                string? categoryName = null;
                string? categoryColor = null;
                
                if (foodWithCategory?.Category != null)
                {
                    categoryName = foodWithCategory.Category.Name;
                    categoryColor = foodWithCategory.Category.Color;
                }
                
                // 添加到历史记录，包含分类信息
                await _historyService.AddHistoryAsync(new History { 
                    Food = foodName,
                    CategoryName = categoryName,
                    CategoryColor = categoryColor,
                    Time = DateTime.UtcNow 
                });
                
                // 返回结果
                return Ok(new { 
                    food = foodName,
                    isRepeat,
                    message
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { 
                    success = false, 
                    message = $"转盘操作失败: {ex.Message}" 
                });
            }
        }

        // 获取设置
        [HttpGet("settings")]
        public async Task<ActionResult<Settings>> GetSettings()
        {
            try
            {
                var settings = await _settingsService.GetSettingsAsync();
                return Ok(settings);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = $"获取设置失败: {ex.Message}" });
            }
        }

        // 更新设置
        [HttpPost("settings")]
        public async Task<ActionResult<Settings>> UpdateSettings([FromBody] Settings settings)
        {
            try
            {
                if (settings == null)
                {
                    return BadRequest(new { success = false, message = "无效的设置数据" });
                }
                
                var updatedSettings = await _settingsService.UpdateSettingsAsync(settings);
                return Ok(updatedSettings);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = $"更新设置失败: {ex.Message}" });
            }
        }

        // 重置为默认设置
        [HttpPost("settings/reset")]
        public async Task<ActionResult<Settings>> ResetSettings()
        {
            try
            {
                var settings = await _settingsService.ResetToDefaultAsync();
                return Ok(settings);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = $"重置设置失败: {ex.Message}" });
            }
        }

        // 获取分类列表
        [HttpGet("categories")]
        public async Task<ActionResult<IEnumerable<object>>> GetCategories()
        {
            var categories = await _categoryService.GetAllCategoriesAsync();
            return categories.Select(c => new 
            {
                id = c.Id,
                name = c.Name,
                description = c.Description,
                color = c.Color,
                iconName = c.IconName
            }).ToList();
        }
        
        // 添加新分类
        [HttpPost("categories")]
        public async Task<ActionResult<object>> AddCategory([FromBody] Category category)
        {
            var (success, message, newCategory) = await _categoryService.AddCategoryAsync(category);
            
            if (success && newCategory != null)
            {
                return new 
                { 
                    success, 
                    message, 
                    category = new 
                    { 
                        id = newCategory.Id, 
                        name = newCategory.Name,
                        description = newCategory.Description,
                        color = newCategory.Color,
                        iconName = newCategory.IconName
                    }
                };
            }
            
            return new { success, message };
        }
        
        // 删除分类
        [HttpDelete("categories/{id}")]
        public async Task<ActionResult<object>> DeleteCategory(int id)
        {
            var (success, message) = await _categoryService.DeleteCategoryAsync(id);
            return new { success, message };
        }
        
        // 重置为默认分类
        [HttpPost("categories/reset")]
        public async Task<ActionResult<IEnumerable<object>>> ResetToDefaultCategories()
        {
            var categories = await _categoryService.ResetToDefaultsAsync();
            return categories.Select(c => new 
            {
                id = c.Id,
                name = c.Name,
                description = c.Description,
                color = c.Color,
                iconName = c.IconName
            }).ToList();
        }

        // 获取带有详细信息的食物列表(包含分类、权重等)
        [HttpGet("foods/details")]
        public async Task<ActionResult<IEnumerable<object>>> GetFoodsDetails(int? categoryId = null)
        {
            var foods = await _foodService.GetAllFoodsAsync(categoryId: categoryId);
            return foods.Select(f => new 
            {
                id = f.Id,
                name = f.Name,
                categoryId = f.CategoryId,
                categoryName = f.Category?.Name,
                weight = f.Weight,
                isFavorite = f.IsFavorite,
                availableFromTime = f.AvailableFromTime?.ToString(),
                availableToTime = f.AvailableToTime?.ToString(),
                exclusionHours = f.ExclusionHours,
                isDefault = f.IsDefault,
                lastSelectedAt = f.LastSelectedAt?.ToString("yyyy-MM-dd HH:mm:ss")
            }).ToList();
        }

        // 设置食物权重
        [HttpPost("foods/{id}/weight")]
        public async Task<ActionResult<object>> SetFoodWeight(int id, [FromBody] int weight)
        {
            if (weight < 1 || weight > 10)
            {
                return BadRequest(new { success = false, message = "权重必须在1到10之间" });
            }
            
            var food = await _foodService.GetFoodAsync(id);
            if (food == null)
            {
                return NotFound(new { success = false, message = "未找到该选项" });
            }
            
            food.Weight = weight;
            await _foodService.UpdateFoodAsync(food);
            
            return new { success = true, message = "权重设置成功" };
        }
        
        // 设置食物为喜爱
        [HttpPost("foods/{id}/favorite")]
        public async Task<ActionResult<object>> SetFoodFavorite(int id, [FromBody] bool isFavorite)
        {
            var food = await _foodService.GetFoodAsync(id);
            if (food == null)
            {
                return NotFound(new { success = false, message = "未找到该选项" });
            }
            
            food.IsFavorite = isFavorite;
            await _foodService.UpdateFoodAsync(food);
            
            return new { success = true, message = isFavorite ? "已设置为喜爱" : "已取消喜爱标记" };
        }
        
        // 设置食物的可用时间
        [HttpPost("foods/{id}/availableTime")]
        public async Task<ActionResult<object>> SetFoodAvailableTime(int id, [FromBody] object timeData)
        {
            var food = await _foodService.GetFoodAsync(id);
            if (food == null)
            {
                return NotFound(new { success = false, message = "未找到该选项" });
            }
            
            try
            {
                // 解析请求体中的时间数据
                var fromTimeStr = (timeData.GetType().GetProperty("fromTime")?.GetValue(timeData) as string)?.Trim();
                var toTimeStr = (timeData.GetType().GetProperty("toTime")?.GetValue(timeData) as string)?.Trim();
                
                if (string.IsNullOrEmpty(fromTimeStr) && string.IsNullOrEmpty(toTimeStr))
                {
                    // 清除时间限制
                    food.AvailableFromTime = null;
                    food.AvailableToTime = null;
                }
                else
                {
                    // 设置时间限制
                    if (!string.IsNullOrEmpty(fromTimeStr) && !TimeOnly.TryParse(fromTimeStr, out var fromTime))
                    {
                        return BadRequest(new { success = false, message = "开始时间格式无效" });
                    }
                    
                    if (!string.IsNullOrEmpty(toTimeStr) && !TimeOnly.TryParse(toTimeStr, out var toTime))
                    {
                        return BadRequest(new { success = false, message = "结束时间格式无效" });
                    }
                    
                    food.AvailableFromTime = string.IsNullOrEmpty(fromTimeStr) ? null : TimeOnly.Parse(fromTimeStr);
                    food.AvailableToTime = string.IsNullOrEmpty(toTimeStr) ? null : TimeOnly.Parse(toTimeStr);
                }
                
                await _foodService.UpdateFoodAsync(food);
                return new { success = true, message = "可用时间设置成功" };
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = $"设置失败: {ex.Message}" });
            }
        }
        
        // 设置食物的排除规则(选中后多久内不再选择)
        [HttpPost("foods/{id}/exclusionHours")]
        public async Task<ActionResult<object>> SetFoodExclusionHours(int id, [FromBody] int hours)
        {
            var food = await _foodService.GetFoodAsync(id);
            if (food == null)
            {
                return NotFound(new { success = false, message = "未找到该选项" });
            }
            
            if (hours < 0 || hours > 168) // 最多一周(168小时)
            {
                return BadRequest(new { success = false, message = "排除小时数必须在0到168之间" });
            }
            
            food.ExclusionHours = hours;
            await _foodService.UpdateFoodAsync(food);
            
            return new { success = true, message = "排除规则设置成功" };
        }
    }
}
