import { app, BrowserWindow, dialog, ipcMain } from 'electron'
import * as fs from 'node:fs/promises'
import * as path from 'node:path'

let mainWindow: BrowserWindow | null = null

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,  // 确保这个是 true
      preload: path.join(__dirname, 'preload.cjs')  // preload.cjs 会和 main.cjs 在同一目录
    }
  })

  if (process.env.NODE_ENV === 'development') {
    await mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    await mainWindow.loadFile('dist/index.html')
  }

  mainWindow.on('ready-to-show', () => {
    console.log('Window ready to show')
    mainWindow?.show()
  })
}

// 等待应用准备就绪后再设置 IPC 处理器
app.whenReady().then(() => {
  createWindow()

  // 设置 IPC 处理器
  ipcMain.handle('showOpenDialog', async (event, options) => {
    try {
      if (!mainWindow) throw new Error('Main window is not available')
      const result = await dialog.showOpenDialog(mainWindow, {
        title: '选择目录',
        properties: ['openDirectory'],
        ...options
      })
      return result
    } catch (error) {
      console.error('Failed to show open dialog:', error)
      throw error
    }
  })

  ipcMain.handle('readDirectory', async (event, dirPath) => {
    try {
      const files = await fs.readdir(dirPath)
      const fileInfos = await Promise.all(
        files.map(async (name) => {
          const filePath = path.join(dirPath, name)
          const stats = await fs.stat(filePath)
          return {
            path: filePath,
            name,
            lastModified: stats.mtimeMs
          }
        })
      )
      return fileInfos
    } catch (error) {
      console.error('Failed to read directory:', error)
      throw error
    }
  })

  ipcMain.handle('readFile', async (event, filePath) => {
    try {
      const content = await fs.readFile(filePath, 'utf-8')
      return content
    } catch (error) {
      console.error('Failed to read file:', error)
      throw error
    }
  })

  ipcMain.handle('writeFile', async (event, filePath, content) => {
    try {
      await fs.writeFile(filePath, content, 'utf-8')
    } catch (error) {
      console.error('Failed to write file:', error)
      throw error
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
}) 