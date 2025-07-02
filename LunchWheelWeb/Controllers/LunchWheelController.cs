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
        private readonly WeeklyFoodService _weeklyFoodService;

        public LunchWheelController(
            FoodService foodService, 
            HistoryService historyService, 
            WeeklyFoodService weeklyFoodService)
        {
            _foodService = foodService;
            _historyService = historyService;
            _weeklyFoodService = weeklyFoodService;
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
            // 获取现有食物
            var existingFoods = await _foodService.GetAllFoodsAsync();
            
            // 删除不在新列表中的食物
            foreach (var existingFood in existingFoods.Where(f => !f.IsDefault))
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
                    await _foodService.AddFoodAsync(new Food { Name = food });
                }
            }
            
            return Ok();
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

        // 获取周食物
        [HttpGet("weeklyFoods")]
        public async Task<ActionResult<IEnumerable<object>>> GetWeeklyFoods()
        {
            var weeklyFoods = await _weeklyFoodService.GetWeeklyFoodsAsync();
            return weeklyFoods.Select(w => new {
                food = w.Food,
                date = w.Date
            }).ToList();
        }

        // 清空周食物
        [HttpDelete("weeklyFoods")]
        public async Task<ActionResult> ClearWeeklyFoods()
        {
            await _weeklyFoodService.ClearWeeklyFoodsAsync();
            return Ok();
        }
    }
}
