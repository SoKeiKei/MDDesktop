const { app, BrowserWindow } = require('electron')
const path = require('path')

let mainWindow = null

function createWindow() {
  // 创建浏览器窗口
  mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    show: false,
    center: true,
    minWidth: 1366,
    minHeight: 768,
    icon: path.join(__dirname, '../resources/icons/icon.ico'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
      sandbox: true
    }
  })

  // 隐藏默认菜单栏
  mainWindow.setMenuBarVisibility(true)
  // 或者完全移除菜单栏
  mainWindow.removeMenu()

  // 加载应用
  if (process.env.NODE_ENV === 'development') {
    // 开发环境下加载本地服务
    console.log('Loading URL:', 'http://localhost:5173/md/')
    mainWindow.loadURL('http://localhost:5173/md/').catch(err => {
      console.error('Failed to load URL:', err)
    })
    // 打开开发工具
    mainWindow.webContents.openDevTools()
  } else {
    // 生产环境下加载打包后的文件
    const indexPath = path.join(__dirname, '../dist/index.html')
    console.log('Loading file:', indexPath)
    // 检查文件是否存在
    try {
      require('fs').accessSync(indexPath)
      console.log('Index file exists')
    } catch (err) {
      console.error('Index file not found:', err)
    }
    mainWindow.loadFile(indexPath).catch(err => {
      console.error('Failed to load file:', err)
      // 显示错误信息
      mainWindow.webContents.openDevTools()
    })
  }

  // 窗口关闭时触发
  mainWindow.on('closed', () => {
    mainWindow = null
  })

  // 窗口准备好后显示
  mainWindow.once('ready-to-show', () => {
    console.log('Window ready to show')
    mainWindow.show()
  })

  // 添加错误处理
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Failed to load:', errorCode, errorDescription)
  })
}

// 应用准备就绪时创建窗口
app.whenReady().then(createWindow).catch(err => {
  console.error('Failed to create window:', err)
})

// 所有窗口关闭时退出应用
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// 在 macOS 上,单击dock图标时没有已打开的其余应用窗口时,则新建应用窗口
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
}) 