using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using LunchWheel.Data;
using LunchWheel.Models;

namespace LunchWheel.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class HistoryController : ControllerBase
    {
        private readonly LunchWheelDbContext _context;

        public HistoryController(LunchWheelDbContext context)
        {
            _context = context;
        }

        // 获取历史记录
        [HttpGet]
        public async Task<ActionResult<IEnumerable<History>>> GetHistory()
        {
            return await _context.History.OrderByDescending(h => h.Time).ToListAsync();
        }

        // 创建历史记录
        [HttpPost]
        public async Task<ActionResult<History>> PostHistory(History history)
        {
            _context.History.Add(history);
            await _context.SaveChangesAsync();

            // 添加到周历史记录
            var weeklyFood = new WeeklyFood
            {
                Food = history.Food,
                Date = history.Time,
                UserId = history.UserId
            };
            
            _context.WeeklyFoods.Add(weeklyFood);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetHistory), new { id = history.Id }, history);
        }

        // 清空历史记录
        [HttpDelete]
        public async Task<IActionResult> DeleteAllHistory()
        {
            var allHistory = await _context.History.ToListAsync();
            _context.History.RemoveRange(allHistory);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
