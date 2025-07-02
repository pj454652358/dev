using LunchWheelWeb.Data;
using LunchWheelWeb.Services;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// 添加服务到容器
builder.Services.AddControllersWithViews();
builder.Services.AddRazorPages();

// 配置服务器端口
builder.WebHost.UseUrls("http://localhost:5000");

// 添加数据库服务
builder.Services.AddDbContext<LunchWheelDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection")));

// 添加应用服务
builder.Services.AddScoped<FoodService>();
builder.Services.AddScoped<HistoryService>();
builder.Services.AddScoped<WeeklyFoodService>();

var app = builder.Build();

// 配置HTTP请求管道
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Error");
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseStaticFiles();
app.UseRouting();
app.UseAuthorization();

app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Index}/{id?}");
app.MapRazorPages();

// 确保数据库创建
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var dbContext = services.GetRequiredService<LunchWheelDbContext>();
        dbContext.Database.EnsureCreated();
    }
    catch (Exception ex)
    {
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "创建数据库时发生错误");
    }
}

app.Run();
