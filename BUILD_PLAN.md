# MD 桌面应用构建计划

## 一、项目现状分析

1. 当前技术栈
- Vue 3 + TypeScript + Vite
- Web 应用已经可以正常运行
- 构建产物约 5.7MB

## 二、桌面应用改造方案

1. 技术选型
- 使用 Electron 作为应用容器
- 直接加载现有 web 应用
- 保持原有功能和代码不变

2. 项目结构
项目根目录/
  ├── src/            # 保持现有 Vue 项目完全不变
  ├── electron/       # 新增 electron 相关文件
  │   └── main.js    # electron 主进程入口
  └── package.json    # 添加 electron 相关配置

3. 改造步骤

### 第一阶段：基础框架搭建

1. 安装依赖
```
npm install electron electron-builder -D
```

2. 创建 electron 主进程入口
electron/main.js:
```js
const { app, BrowserWindow } = require('electron')

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  })

  // 开发环境加载本地服务
  if (process.env.NODE_ENV === 'development') {
    win.loadURL('http://localhost:5173')
  } else {
    // 生产环境加载打包后的 index.html
    win.loadFile('./dist/index.html')
  }
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
```

3. 更新 package.json
```json
{
  "scripts": {
    "electron:dev": "vite & electron electron/main.js",
    "electron:build": "vite build && electron-builder"
  },
  "build": {
    "appId": "com.doocs.md",
    "productName": "Doocs MD",
    "directories": {
      "output": "release"
    },
    "files": [
      "dist/**/*",
      "electron/**/*"
    ]
  }
}
```

4. 验证步骤
- 启动 web 应用确认正常运行: `npm run dev`
- 执行开发环境验证: `npm run electron:dev`
- 执行生产构建验证: `npm run electron:build`

### 第二阶段：打包配置

1. 基础打包配置
- Windows 和 macOS 基础配置
- 应用图标配置

2. 环境区分
- 区分开发和生产环境
- 配置开发环境热重载

### 第三阶段：优化完善

1. 基础功能
- 窗口最小化/最大化/关闭
- 窗口大小和位置记忆

## 三、开发流程规范

1. 分支管理
- main: 主分支
- electron: 桌面应用开发分支

2. 开发模式
- web 开发流程保持不变
- electron 开发独立进行
- 通过 npm scripts 管理命令

## 四、发布流程

1. 打包发布
- 使用 electron-builder 打包
- 生成各平台安装包

2. 分发方式
- GitHub Release
- 第三方分发平台

## 五、进度规划

1. 第一阶段 (2天)
- 安装依赖
- 创建 electron 主进程
- 验证基础功能

2. 第二阶段 (2天)
- 配置打包选项
- 测试打包流程
- 修复可能的问题

3. 第三阶段 (1天)
- 优化窗口控制
- 测试发布流程

## 六、注意事项

1. 保持简单
- 不修改现有 web 应用代码
- 只添加必要的桌面功能
- 避免复杂的定制化

2. 关注重点
- 确保资源路径正确
- 验证应用启动流程
- 测试打包结果

3. 潜在问题
- 开发环境端口配置
- 静态资源路径处理
- 打包后的资源访问 