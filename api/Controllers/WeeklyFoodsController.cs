using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using LunchWheel.Data;
using LunchWheel.Models;

namespace LunchWheel.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class WeeklyFoodsController : ControllerBase
    {
        private readonly LunchWheelDbContext _context;

        public WeeklyFoodsController(LunchWheelDbContext context)
        {
            _context = context;
        }

        // 获取一周内已选食物
        [HttpGet]
        public async Task<ActionResult<IEnumerable<WeeklyFood>>> GetWeeklyFoods()
        {
            // 获取一周前的日期
            var oneWeekAgo = DateTime.Now.AddDays(-7);
            
            // 返回一周内的食物
            return await _context.WeeklyFoods
                .Where(w => w.Date >= oneWeekAgo)
                .OrderByDescending(w => w.Date)
                .ToListAsync();
        }

        // 清空一周内已选食物
        [HttpDelete]
        public async Task<IActionResult> DeleteAllWeeklyFoods()
        {
            var weeklyFoods = await _context.WeeklyFoods.ToListAsync();
            _context.WeeklyFoods.RemoveRange(weeklyFoods);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
