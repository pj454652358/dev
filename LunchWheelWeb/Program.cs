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
builder.Services.AddScoped<DbInitializerService>();

var app = builder.Build();

// 配置HTTP请求管道
if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
}
else
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

// 初始化数据库和预加载数据
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var initializer = services.GetRequiredService<DbInitializerService>();
        await initializer.InitializeAsync();
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogInformation("数据库初始化和数据预加载完成");
    }
    catch (Exception ex)
    {
        var logger = services.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "初始化数据库或预加载数据时发生错误");
    }
}

app.Run();
