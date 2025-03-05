export interface FileInfo {
  path: string
  name: string
  isDirectory: boolean
  lastModified: number
}

export interface ElectronAPI {
  // 目录操作
  showOpenDialog: (options: {
    title?: string
    properties: Array<'openDirectory' | 'openFile' | 'multiSelections'>
  }) => Promise<{
    canceled: boolean
    filePaths: string[]
  }>
  
  // 文件系统操作
  readDirectory: (path: string) => Promise<FileInfo[]>
  readFile: (path: string) => Promise<string>
  writeFile: (path: string, content: string) => Promise<void>
}

// 全局类型声明
declare global {
  interface Window {
    electron: ElectronAPI
  }
} 