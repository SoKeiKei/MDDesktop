# MD Desktop

基于 [doocs/md](https://github.com/doocs/md) 二次开发的桌面版微信 Markdown 编辑器。


![v1.1.0 windows版](https://fastly.jsdelivr.net/gh/bucketio/img18@main/2025/03/06/1741198739557-0b7fae65-4d25-49d6-8840-878fbe95699b.png)


<img width="1680" alt="macOS版" src="https://github.com/user-attachments/assets/7eb70a43-185d-4891-a05d-de930ed9fee5" />

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
  - 本地内容管理

- v1.1.0 新增功能:
  - 增加本地目录导入功能
  - 智能目录过滤（类似 .gitignore）
  - 目录树层级显示优化
  - 文件名称完整显示（Tooltip）
  - 当前打开文件高亮
  - 可拖动调整内存文档面板高度
  - 文件导入编辑器功能增强

  >原版内容管理功能保留，调整了样式折叠在侧边栏左下角

- 桌面版增强:
  - 独立窗口应用
  - 更大的编辑区域(1920x1080)
  - 简洁的界面布局
  - 无需浏览器即可使用

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
- Windows: `MD Desktop-1.1.0-win-x64.exe`
- macOS: `MD.Desktop-1.1.0.dmg`
- Linux: `MD Desktop-1.1.0-linux-x64.AppImage`

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

1. [下载对应平台的安装包](https://github.com/SoKeiKei/MDDesktop/releases/tag/v1.1.0) 
2. 安装并运行应用
3. 开始使用 Markdown 编辑器

*不要问我安装包为什么这么大，我也不知道 😂*

macOS 用户首次运行可能需要在"系统偏好设置"中允许来自身份不明开发者的应用。

## 更新日志

### v1.1.0 (2025-03-06)
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