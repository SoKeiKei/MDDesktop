# MD Desktop

基于 [doocs/md](https://github.com/doocs/md) 二次开发的桌面版微信 Markdown 编辑器。

![v1.1.2 windows版](https://fastly.jsdelivr.net/gh/bucketio/img8@main/2025/03/07/1741282916081-dd8295eb-538e-4bae-b4b9-359280dd71c9.png)

## 重要说明

- 如需无任何功能修改的原版 MD Desktop，请前往 [main 分支获取 v1.0.0 版本](https://github.com/SoKeiKei/MDDesktop/tree/main)
- dev 分支从 v1.1.0 开始，对原版功能进行二次开发和增强
- **从 v1.1.0 开始不再支持单独运行 Web 版本**，原因如下：
  - 新增的本地目录导入功能依赖 Electron 的文件系统 API
  - 智能目录过滤功能需要 Node.js 环境支持
  - 文件系统操作相关功能与桌面应用深度集成
  - 移除了部分纯 Web 环境的兼容代码以优化性能

## 项目介绍

本项目在保持原有 Web 版本全部功能的基础上，使用 Electron 封装了桌面应用版本。
项目为我学习编程的"作业"，使用 AI 辅助开发。

### 主要特性

- 保留原有所有功能:
  - 支持完整的 Markdown 语法
  - 支持数学公式、Mermaid 图表
  - 丰富的代码高亮主题
  - 自定义主题和 CSS 样式
  - 多图床上传支持
  - 文档导入导出


- 桌面版:
  - 独立窗口应用，无需浏览器，无需部署，开箱即用
  - 文件系统功能
    - 本地目录导入和管理  
  - 编辑器
    - 新增多个编辑功能
    - 语法提示和自动补全
    - 语法高亮优化
  - 预览窗口
    - 支持移动端(375px)和自适应大屏预览  
  - 界面优化
    - 优化的工具栏和状态栏
    - 完整的文件路径显示

## 开发说明

### 环境要求

- Node.js >= 18
- npm >= 9

### 安装依赖

```bash
# 安装项目依赖
npm install
```

### 开发模式

```bash
# 启动桌面应用开发模式
npm run electron:dev
```

> 注意：本项目已不支持单独运行 Web 版本，必须通过 electron:dev 启动完整的桌面应用进行开发。

### 构建应用

Windows 版本构建：
```bash
# 构建桌面应用
npm run electron:build:win
```

macOS 版本构建：
```bash
# 需要在 macOS 系统上执行
npm run electron:build:mac
```

Linux 版本构建：
```bash
# 在 Linux 系统上执行
npm run electron:build:linux
```

构建产物将输出到 `release` 目录：
- Windows: `MD Desktop-1.1.1-win-x64.exe`
- macOS: `MD.Desktop-1.1.1.dmg`
- Linux: `MD Desktop-1.1.1-linux-x64.AppImage`

> 注意：跨平台构建可能会遇到一些限制，建议在目标平台上进行构建。

## 项目结构

```
├── electron/          # Electron 相关代码
│   ├── main.ts       # 主进程入口
│   └── preload.ts    # 预加载脚本
├── src/              # Web 应用源码
│   ├── components/   # Vue 组件
│   ├── stores/       # Pinia 状态管理
│   └── utils/        # 工具函数
├── dist/             # Web 应用构建产物
└── release/          # 桌面应用构建产物
└── resources/        # 应用资源文件
     └── icons/       # 应用图标
```

## 使用说明

1. [下载对应平台的安装包](https://github.com/SoKeiKei/MDDesktop/releases/tag/v1.1.1) 
2. 安装并运行应用
3. 开始使用 Markdown 编辑器

macOS 用户首次运行可能需要在"系统偏好设置"中允许来自身份不明开发者的应用。

## 更新日志

### v1.1.2 (2025-03-09)

- 新增阅览模式切换功能
  - 支持移动端预览模式(375px)和自适应大屏模式
  - 阅览窗口右上角添加便捷切换按钮
  
- 优化编辑工具栏
  - 将常用编辑功能移至顶部工具栏
  - 添加图标提示和快捷键说明
  - 优化功能状态显示效果
  

![工具栏组件](https://fastly.jsdelivr.net/gh/bucketio/img13@main/2025/03/07/1741282874799-d3b63f49-4824-4c29-90ff-22d19b325301.png)


- 增强编辑功能
  - 新增标题快捷菜单 (Ctrl/⌘ + 1/2/3)
  - 新增列表快捷菜单 (Ctrl/⌘ + U/O/T)
  - 新增引用块功能 (Ctrl/⌘ + Q)
  - 新增代码块功能 (Ctrl/⌘ + Shift + K)
  - 新增分隔线功能 (Ctrl/⌘ + Shift + H)H
  - 新增图片链接功能 (Ctrl/⌘ + Shift + I)
  - 新增查找/替换功能 (Ctrl/⌘ + F/H)
  - 使用 HTML 标签实现左对齐、居中对齐、右对齐、两端对齐 (Ctrl/⌘+[, Ctrl/⌘+M, Ctrl/⌘+], Ctrl/⌘+J)
  - 自动补全标签对

- 优化编辑器语法高亮
  - 完善 Markdown 语法颜色方案
  - 适配明暗两种主题

- 优化代码提示功能
  - 完善 Markdown 语法提示，显示完整语法示例和中文说明
  - 添加语法高亮显示
  - 改进快捷键提示显示

- 优化返回顶部交互体验
  - 统一 Windows/macOS 平滑滚动效果
  - 改进滚动动画表现
- 修复问题
  - 修复复制功能提示不显示的问题
  - 优化复制操作的交互体验
- 修复其他已知问题

### v1.1.1 (2025-03-07)
- 优化文件路径显示方式
- 改进目录树在 macOS 系统下的兼容性
- 完善状态栏路径显示功能
- 优化侧边栏界面布局
- 修复其他已知问题

### v1.1.0 (2025-03-06)
- 新增本地目录导入管理
- 新增智能目录过滤功能
- 优化目录树显示和交互
- 改进文件导入编辑器功能
- 完善深色模式适配
- 添加面板拖拽调整功能
- 修复已知问题
- 移除 Web 版本独立运行支持


### v1.0.0 (2025-03-04)
- 首次发布
- 实现基础功能

## 致谢

- [doocs/md](https://github.com/doocs/md) - 提供了优秀的 Web 版本实现
- [Electron](https://www.electronjs.org/) - 提供桌面应用开发框架

## 许可证

本项目基于 [WTFPL](LICENSE) 许可证开源。