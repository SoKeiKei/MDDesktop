import { app, BrowserWindow } from 'electron'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

let mainWindow = null

function createWindow() {
  // 创建浏览器窗口
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  })

  // 加载应用
  if (process.env.NODE_ENV === 'development') {
    // 开发环境下加载本地服务
    mainWindow.loadURL('http://localhost:5173').catch(err => {
      console.error('Failed to load URL:', err)
    })
    // 打开开发工具
    mainWindow.webContents.openDevTools()
  } else {
    // 生产环境下加载打包后的文件
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html')).catch(err => {
      console.error('Failed to load file:', err)
    })
  }

  // 窗口关闭时触发
  mainWindow.on('closed', () => {
    mainWindow = null
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