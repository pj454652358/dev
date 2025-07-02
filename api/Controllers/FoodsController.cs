using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using LunchWheel.Data;
using LunchWheel.Models;

namespace LunchWheel.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class FoodsController : ControllerBase
    {
        private readonly LunchWheelDbContext _context;

        public FoodsController(LunchWheelDbContext context)
        {
            _context = context;
        }

        // 获取所有食物
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Food>>> GetFoods()
        {
            return await _context.Foods.ToListAsync();
        }

        // 获取单个食物
        [HttpGet("{id}")]
        public async Task<ActionResult<Food>> GetFood(int id)
        {
            var food = await _context.Foods.FindAsync(id);

            if (food == null)
            {
                return NotFound();
            }

            return food;
        }

        // 创建新食物
        [HttpPost]
        public async Task<ActionResult<Food>> PostFood(Food food)
        {
            _context.Foods.Add(food);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetFood), new { id = food.Id }, food);
        }

        // 更新食物
        [HttpPut("{id}")]
        public async Task<IActionResult> PutFood(int id, Food food)
        {
            if (id != food.Id)
            {
                return BadRequest();
            }

            _context.Entry(food).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!FoodExists(id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
        }

        // 删除食物
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteFood(int id)
        {
            var food = await _context.Foods.FindAsync(id);
            if (food == null)
            {
                return NotFound();
            }

            _context.Foods.Remove(food);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // 重置为默认食物列表
        [HttpPost("reset")]
        public async Task<ActionResult<IEnumerable<Food>>> ResetDefaultFoods()
        {
            // 获取当前非默认食物
            var nonDefaultFoods = await _context.Foods.Where(f => !f.IsDefault).ToListAsync();
            
            // 删除所有非默认食物
            _context.Foods.RemoveRange(nonDefaultFoods);
            
            // 确保所有默认食物都存在
            var defaultFoods = await _context.Foods.Where(f => f.IsDefault).ToListAsync();
            
            await _context.SaveChangesAsync();
            
            // 返回所有食物（应该只有默认食物了）
            return await _context.Foods.ToListAsync();
        }
        
        // 检查食物是否存在
        private bool FoodExists(int id)
        {
            return _context.Foods.Any(e => e.Id == id);
        }
    }
}
