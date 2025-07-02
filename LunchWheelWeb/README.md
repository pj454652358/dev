# 午餐转盘应用 - .NET Core 版

这是一个基于 ASP.NET Core 构建的午餐转盘应用，整合了前端和后端，使用 C# 进行数据持久化。

## 项目特点

- 使用 ASP.NET Core MVC 整合前后端
- 使用 Entity Framework Core 和 SQLite 进行数据持久化
- 响应式设计，适配各种屏幕尺寸
- 转盘动画效果和音效
- 记录历史选择和一周内已选食物

## 安装和运行

### 环境要求

- .NET 8.0 SDK
- Visual Studio 2022 或 VS Code

### 运行步骤

1. 克隆项目到本地
   ```bash
   git clone <repository-url>
   ```

2. 进入项目目录
   ```bash
   cd LunchWheelWeb
   ```

3. 恢复依赖项
   ```bash
   dotnet restore
   ```

4. 运行应用
   ```bash
   dotnet run
   ```

5. 打开浏览器，访问 `http://localhost:5000`

## 功能

- **转盘页面**: 随机选择食物
- **设置页面**: 添加、删除食物选项，恢复默认列表
- **历史记录**: 查看历史选择记录
- **周选择跟踪**: 记录一周内已选择的食物，避免频繁选择相同的选项

## 技术栈

- **后端**: ASP.NET Core, Entity Framework Core, SQLite
- **前端**: HTML, CSS, JavaScript, Canvas API
- **动画**: 使用 Canvas 绘制转盘动画
- **音效**: 使用 Web Audio API 和音频文件

## 项目结构

- **Controllers/**: 控制器文件
  - HomeController.cs: 主页控制器
  - LunchWheelController.cs: API 控制器
- **Models/**: 数据模型
  - Food.cs: 食物模型
  - History.cs: 历史记录模型
  - WeeklyFood.cs: 周选择模型
- **Services/**: 业务逻辑服务
  - FoodService.cs: 食物服务
  - HistoryService.cs: 历史记录服务
  - WeeklyFoodService.cs: 周选择服务
- **Views/**: 视图文件
- **wwwroot/**: 静态资源
  - css/: 样式文件
  - js/: JavaScript 文件
  - assets/: 图片、音效等资源
