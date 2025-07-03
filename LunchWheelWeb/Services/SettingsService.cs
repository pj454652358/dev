using LunchWheelWeb.Data;
using LunchWheelWeb.Models;
using Microsoft.EntityFrameworkCore;

namespace LunchWheelWeb.Services
{
    public class SettingsService
    {
        private readonly LunchWheelDbContext _context;
        
        public SettingsService(LunchWheelDbContext context)
        {
            _context = context;
        }
        
        /// <summary>
        /// 获取当前的应用设置，如果没有则创建默认设置
        /// </summary>
        public async Task<Settings> GetSettingsAsync(string? userId = null)
        {
            var settings = await _context.Settings
                .FirstOrDefaultAsync(s => s.UserId == userId);
                
            if (settings == null)
            {
                // 创建默认设置
                settings = new Settings
                {
                    UserId = userId,
                    Title = "午餐吃什么？",
                    ItemName = "食物",
                    Theme = "food"
                };
                
                _context.Settings.Add(settings);
                await _context.SaveChangesAsync();
            }
            
            return settings;
        }
        
        /// <summary>
        /// 更新应用设置
        /// </summary>
        public async Task<Settings> UpdateSettingsAsync(Settings settings)
        {
            if (settings == null)
                throw new ArgumentNullException(nameof(settings));
                
            var existingSettings = await _context.Settings
                .FirstOrDefaultAsync(s => s.UserId == settings.UserId);
                
            if (existingSettings == null)
            {
                // 如果不存在则创建新设置
                settings.UpdatedAt = DateTime.UtcNow;
                _context.Settings.Add(settings);
            }
            else
            {
                // 更新现有设置
                existingSettings.Title = settings.Title;
                existingSettings.ItemName = settings.ItemName;
                existingSettings.Theme = settings.Theme;
                existingSettings.UpdatedAt = DateTime.UtcNow;
            }
            
            await _context.SaveChangesAsync();
            return existingSettings ?? settings;
        }
        
        /// <summary>
        /// 重置为默认设置
        /// </summary>
        public async Task<Settings> ResetToDefaultAsync(string? userId = null)
        {
            var settings = await _context.Settings
                .FirstOrDefaultAsync(s => s.UserId == userId);
                
            if (settings != null)
            {
                settings.Title = "午餐吃什么？";
                settings.ItemName = "食物";
                settings.Theme = "food";
                settings.UpdatedAt = DateTime.UtcNow;
                
                await _context.SaveChangesAsync();
                return settings;
            }
            
            // 如果设置不存在，创建默认设置
            return await GetSettingsAsync(userId);
        }
    }
}
