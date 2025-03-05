import { contextBridge, ipcRenderer } from 'electron'
import type { ElectronAPI } from '../src/types/electron'

// 确保类型安全的 API 实现
const api: ElectronAPI = {
  showOpenDialog: (options) => ipcRenderer.invoke('showOpenDialog', options),
  readDirectory: (path) => ipcRenderer.invoke('readDirectory', path),
  readFile: (path) => ipcRenderer.invoke('readFile', path),
  writeFile: (path, content) => ipcRenderer.invoke('writeFile', path, content)
}

// 暴露 API 到渲染进程
contextBridge.exposeInMainWorld('electron', api) 