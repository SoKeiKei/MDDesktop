/**
 * 文档管理模式
 */
export enum DocumentMode {
  MEMORY = 'memory',
  LOCAL = 'local'
}

/**
 * 本地目录信息
 */
export interface LocalDirectory {
  path: string
  lastAccess: number
}

/**
 * 本地文件信息
 */
export interface LocalFile {
  path: string
  name: string
  lastModified: number
}

/**
 * 本地目录状态
 */
export interface LocalDirectoryState {
  currentMode: DocumentMode
  lastMemoryIndex: number
  lastLocalPath: string | null
  recentDirs: LocalDirectory[]
  currentDir: string | null
  localFiles: LocalFile[]
} 