import { app, BrowserWindow, dialog, ipcMain } from 'electron'
import { join } from 'path'
import { promises as fs } from 'fs'

interface FileInfo {
  path: string
  name: string
  isDirectory: boolean
  lastModified: number
}

let mainWindow: BrowserWindow | null = null

async function waitForViteServer(url: string, maxAttempts = 10): Promise<void> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await fetch(url)
      if (response.ok) return
    } catch {
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }
  throw new Error('Vite server not ready')
}

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1920,
    height: 1080,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: join(__dirname, 'preload.cjs'),
      webSecurity: false
    }
  })

  if (process.env.NODE_ENV === 'development') {
    const devServerUrl = 'http://localhost:5173'
    try {
      // 等待 Vite 开发服务器准备就绪
      await waitForViteServer(devServerUrl)
      await mainWindow.loadURL(devServerUrl)
      mainWindow.webContents.openDevTools()
    } catch (error) {
      console.error('Failed to connect to dev server:', error)
      app.quit()
    }
  } else {
    await mainWindow.loadFile('dist/index.html')
  }

  mainWindow.on('ready-to-show', () => {
    console.log('Window ready to show')
    mainWindow?.show()
  })
}

// 等待应用准备就绪后再设置 IPC 处理器
app.whenReady().then(async () => {
  try {
    await createWindow()
  } catch (error) {
    console.error('Failed to create window:', error)
    app.quit()
  }

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

  ipcMain.handle('readDirectory', async (_, path: string) => {
    try {
      const files = await fs.readdir(path, { withFileTypes: true })
      const results = []
      
      for (const file of files) {
        const filePath = join(path, file.name)
        const stats = await fs.stat(filePath)
        
        results.push({
          path: filePath,
          name: file.name,
          isDirectory: file.isDirectory(),
          lastModified: stats.mtimeMs
        })
      }
      
      return results
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