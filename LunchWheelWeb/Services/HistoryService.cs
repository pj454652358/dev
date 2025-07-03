using LunchWheelWeb.Data;
using LunchWheelWeb.Models;
using Microsoft.EntityFrameworkCore;

namespace LunchWheelWeb.Services
{
    public class HistoryService
    {
        private readonly LunchWheelDbContext _context;

        public HistoryService(LunchWheelDbContext context)
        {
            _context = context;
        }

        public async Task<List<History>> GetHistoryAsync(string? userId = null)
        {
            return await _context.History
                .Where(h => string.IsNullOrEmpty(userId) || h.UserId == userId)
                .OrderByDescending(h => h.Time)
                .ToListAsync();
        }

        public async Task AddHistoryAsync(History history)
        {
            _context.History.Add(history);
            await _context.SaveChangesAsync();
        }

        public async Task ClearHistoryAsync(string? userId = null)
        {
            var history = await _context.History
                .Where(h => string.IsNullOrEmpty(userId) || h.UserId == userId)
                .ToListAsync();

            _context.History.RemoveRange(history);
            await _context.SaveChangesAsync();
        }
    }
}
