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

        public LunchWheelController(
            FoodService foodService, 
            HistoryService historyService, 
            SettingsService settingsService)
        {
            _foodService = foodService;
            _historyService = historyService;
            _settingsService = settingsService;
        }

        // 获取食物列表
        [HttpGet("foods")]
        public async Task<ActionResult<IEnumerable<string>>> GetFoods()
        {
            var foods = await _foodService.GetAllFoodsAsync();
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
                time = h.Time.ToLocalTime().ToString(),
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
        public async Task<ActionResult<object>> SpinWheel()
        {
            try
            {
                // 随机选择食物
                var food = await _foodService.GetRandomFoodAsync();
                
                // 添加到历史记录
                await _historyService.AddHistoryAsync(new History { 
                    Food = food, 
                    Time = DateTime.UtcNow 
                });
                
                // 返回结果
                return Ok(new { 
                    food,
                    isRepeat = false,
                    message = (string?)null
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
    }
}
