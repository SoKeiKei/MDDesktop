import { contextBridge, ipcRenderer } from 'electron'
import type { ElectronAPI } from '../src/types/electron'

// 创建类型安全的 API
const api: ElectronAPI = {
  showOpenDialog: (options) => ipcRenderer.invoke('showOpenDialog', options),
  readDirectory: (path) => ipcRenderer.invoke('readDirectory', path),
  readFile: (path) => ipcRenderer.invoke('readFile', path),
  writeFile: (path, content) => ipcRenderer.invoke('writeFile', path, content)
}

// 暴露 API 到渲染进程
contextBridge.exposeInMainWorld('electron', api)

// 不需要重复声明类型，因为已经从 electron.d.ts 导入了
export {} // 确保这个文件被视为模块 