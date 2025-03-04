# MD Desktop

基于 [doocs/md](https://github.com/doocs/md) 二次开发的桌面版微信 Markdown 编辑器。

![image](https://github.com/user-attachments/assets/684d128d-d49c-4b70-8127-6590f3047796)

<img width="1680" alt="截屏2025-03-04 下午1 00 16" src="https://github.com/user-attachments/assets/7eb70a43-185d-4891-a05d-de930ed9fee5" />


## 项目介绍

本项目在保持原有 Web 版本全部功能的基础上，使用 Electron 封装了桌面应用版本。
项目为我学习编程的“作业”，使用AI辅助开发，不保证一定能构建成功，不保证100%还原原项目功能。

### 主要特性

- 保留原有所有功能:
  - 支持完整的 Markdown 语法
  - 支持数学公式、Mermaid 图表
  - 丰富的代码高亮主题
  - 自定义主题和 CSS 样式
  - 多图床上传支持
  - 文档导入导出
  - 本地内容管理

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
# 启动开发服务
npm run electron:dev
```

### 构建应用

Windows 版本构建：
```bash
# 构建桌面应用
npm run electron:build
```

macOS 版本构建 ：
```bash
# 需要在 macOS 系统上执行
npm run electron:build -- --mac

# 如果需要同时构建 Intel 和 Apple Silicon 版本
npm run electron:build -- --mac --universal
```

Linux 版本构建 （未验证可用性）：
```bash
# 在 Linux 系统上执行
npm run electron:build -- --linux

# 支持的格式：AppImage, snap, deb, rpm
npm run electron:build -- --linux deb rpm
```

构建产物将输出到 `release` 目录：
- Windows: `MD Desktop-1.0.0-win-x64.exe`
- macOS: `MD.Desktop-1.0.0-universal.dmg`
- Linux: `MD Desktop-1.0.0-linux-x64.AppImage`

> 注意：跨平台构建可能会遇到一些限制，建议在目标平台上进行构建。

## 项目结构

```
├── electron/          # Electron 相关代码
│   └── main.cjs      # 主进程入口
├── src/              # Web 应用源码(来自 doocs/md)
├── dist/             # Web 应用构建产物
└── release/          # 桌面应用构建产物
└── resources/        # 应用资源文件
     └── icons/       # 应用图标
```

## 使用说明

1. [下载对应平台的安装包](https://github.com/SoKeiKei/MDDesktop/releases/tag/v1.0.0) 
2. 安装并运行应用
3. 开始使用 Markdown 编辑器

*不要问我安装包为什么这么大，我也不知道 😂*

macOS 用户首次运行可能需要在"系统偏好设置"中允许来自身份不明开发者的应用。

## 致谢

- [doocs/md](https://github.com/doocs/md) - 提供了优秀的 Web 版本实现
- [Electron](https://www.electronjs.org/) - 提供桌面应用开发框架

## 许可证

本项目基于 [WTFPL](LICENSE) 许可证开源。
