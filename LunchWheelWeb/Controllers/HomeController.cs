using LunchWheelWeb.Models;
using LunchWheelWeb.Services;
using Microsoft.AspNetCore.Mvc;

namespace LunchWheelWeb.Controllers
{
    public class HomeController : Controller
    {
        private readonly FoodService _foodService;
        private readonly HistoryService _historyService;
        private readonly SettingsService _settingsService;
        private readonly CategoryService _categoryService;

        public HomeController(
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

        public async Task<IActionResult> Index()
        {
            var foods = await _foodService.GetAllFoodsAsync();
            ViewBag.Foods = foods.Select(f => f.Name).ToList();
            
            var history = await _historyService.GetHistoryAsync();
            ViewBag.History = history.Select(h => new 
            { 
                Food = h.Food, 
                Time = h.Time.ToLocalTime().ToString(), 
                Saved = true 
            }).ToList();
            
            // 获取设置
            var settings = await _settingsService.GetSettingsAsync();
            ViewBag.Settings = settings;
            
            // 获取分类列表
            var categories = await _categoryService.GetAllCategoriesAsync();
            ViewBag.Categories = categories.Select(c => new
            {
                id = c.Id,
                name = c.Name,
                description = c.Description,
                color = c.Color,
                iconName = c.IconName
            }).ToList();
            
            return View();
        }

        // 添加食物
        [HttpPost]
        public async Task<IActionResult> AddFood(string foodName)
        {
            if (!string.IsNullOrEmpty(foodName))
            {
                var result = await _foodService.AddFoodAsync(new Food { Name = foodName.Trim() });
                
                // 添加临时数据来显示消息
                if (result.success)
                {
                    TempData["SuccessMessage"] = result.message;
                }
                else
                {
                    TempData["ErrorMessage"] = result.message;
                }
            }
            else
            {
                TempData["ErrorMessage"] = "食物名称不能为空";
            }
            
            return RedirectToAction("Index");
        }
        
        // 删除食物
        [HttpPost]
        public async Task<IActionResult> DeleteFood(int id)
        {
            await _foodService.DeleteFoodAsync(id);
            return RedirectToAction("Index");
        }
        
        // 重置为默认食物
        [HttpPost]
        public async Task<IActionResult> ResetFoods()
        {
            await _foodService.ResetToDefaultsAsync();
            return RedirectToAction("Index");
        }
        
        // 添加历史记录
        [HttpPost]
        public async Task<IActionResult> AddHistory(string food)
        {
            await _historyService.AddHistoryAsync(new History { Food = food });
            return RedirectToAction("Index");
        }
        
        // 清空历史记录
        [HttpPost]
        public async Task<IActionResult> ClearHistory()
        {
            await _historyService.ClearHistoryAsync();
            return RedirectToAction("Index");
        }
        
        // 清空周食物方法已移除
        
        // AJAX接口，用于前端JS调用
        
        // 获取食物列表
        [HttpGet]
        public async Task<JsonResult> GetFoods()
        {
            var foods = await _foodService.GetAllFoodsAsync();
            return Json(foods.Select(f => f.Name).ToList());
        }
        
        // 获取历史记录
        [HttpGet]
        public async Task<JsonResult> GetHistory()
        {
            var history = await _historyService.GetHistoryAsync();
            return Json(history.Select(h => new { 
                food = h.Food, 
                time = h.Time.ToLocalTime().ToString(), 
                saved = true 
            }).ToList());
        }
        
        // 获取周食物方法已移除
    }
}
