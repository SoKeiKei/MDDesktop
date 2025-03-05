import { defineStore } from 'pinia'
import { useStore } from '@/stores'
import { useStorage } from '@vueuse/core'
import { toast } from '@/utils/toast'  // 使用系统原有的 toast
import type { LocalDirectoryState, LocalDirectory, LocalFile, FileInfo } from '@/types/localDirectory'
import { DocumentMode } from '@/types/localDirectory'
import { ref } from 'vue'  // 添加 ref

/**
 * 本地目录管理 Store
 */
export const useLocalDirectoryStore = defineStore('localDirectory', () => {
  // 从 localStorage 读取初始状态
  const storedState = localStorage.getItem('local_directory_state')
  const initialState = storedState ? JSON.parse(storedState) : {
    currentMode: DocumentMode.MEMORY,
    lastMemoryIndex: 0,
    lastLocalPath: null,
    recentDirs: [],
    currentDir: null,
    localFiles: []
  }

  /**
   * 本地目录状态
   */
  const state = useStorage<LocalDirectoryState>('local_directory_state', initialState)

  // 添加调试日志
  if (import.meta.env.DEV) {
    console.log('Initial state loaded:', state.value)
  }

  /**
   * 切换文档管理模式
   * @param mode - 目标模式
   * @returns void
   */
  function switchMode(mode: DocumentMode): void {
    if (import.meta.env.DEV) {
      console.log('Switching mode from', state.value.currentMode, 'to', mode)
    }

    // 保存当前模式状态
    if (state.value.currentMode === DocumentMode.MEMORY) {
      state.value.lastMemoryIndex = useStore().currentPostIndex
    } else {
      state.value.lastLocalPath = state.value.currentDir
    }
    
    // 更新模式
    state.value = {
      ...state.value,
      currentMode: mode
    }

    if (import.meta.env.DEV) {
      console.log('State after mode switch:', state.value)
    }

    // 恢复目标模式的状态
    if (mode === DocumentMode.MEMORY) {
      // 恢复上次的内存文档索引
      useStore().currentPostIndex = state.value.lastMemoryIndex
    } else if (mode === DocumentMode.LOCAL && state.value.lastLocalPath) {
      // 如果有上次打开的目录，自动打开
      switchDirectory(state.value.lastLocalPath)
    }

    // 手动保存状态
    localStorage.setItem('local_directory_state', JSON.stringify(state.value))
  }

  /**
   * 打开本地目录
   * @returns Promise<void>
   */
  async function openDirectory(): Promise<void> {
    try {
      const { canceled, filePaths } = await window.electron.showOpenDialog({
        properties: ['openDirectory']
      })

      if (!canceled && filePaths[0]) {
        await switchDirectory(filePaths[0])
      }
    } catch (error) {
      console.error('Failed to open directory:', error)
      toast.error('打开目录失败')
    }
  }

  /**
   * 切换目录
   * @param path - 目录路径
   * @returns Promise<void>
   */
  async function switchDirectory(path: string): Promise<void> {
    try {
      const files = await readDirectory(path)
      console.log('Switching to directory:', path, 'Files:', files)
      
      // 更新状态
      state.value = {
        ...state.value,
        currentDir: path,
        localFiles: files,
        recentDirs: [
          { path, lastAccess: Date.now() },
          ...(Array.isArray(state.value.recentDirs) ? state.value.recentDirs.filter(d => d.path !== path) : [])
        ].slice(0, 5),
        lastLocalPath: path  // 保存最后打开的目录
      }

      // 手动保存状态
      localStorage.setItem('local_directory_state', JSON.stringify(state.value))

      toast.success('切换目录成功')
    } catch (error) {
      console.error('Failed to switch directory:', error)
      toast.error('切换目录失败')
    }
  }

  /**
   * 检查是否应该忽略该路径
   * @param path - 要检查的路径
   * @returns boolean - 是否应该忽略
   */
  function shouldIgnorePath(path: string): boolean {
    // 常见需要忽略的目录
    const ignorePatterns = [
      // 版本控制
      '.git',
      '.svn',
      '.hg',
      
      // 依赖和构建
      'node_modules',
      'dist',
      'build',
      
      // IDE 和编辑器
      '.idea',
      '.vscode',
      '.vs',
      
      // 系统文件
      '.DS_Store',
      'Thumbs.db',
      
      // 其他常见忽略目录
      'tmp',
      'temp',
      'log',
      'logs',
      'cache',
      '.cache'
    ]

    const normalizedPath = path.replace(/\\/g, '/')
    const pathParts = normalizedPath.split('/')
    const fileName = pathParts[pathParts.length - 1]

    return (
      // 检查是否匹配忽略模式
      ignorePatterns.some(pattern => 
        normalizedPath.includes(`/${pattern}/`) || 
        normalizedPath.endsWith(`/${pattern}`)
      ) ||
      // 隐藏文件和目录（以.开头）
      fileName.startsWith('.') ||
      // Windows 系统隐藏文件属性
      Boolean(fileName.match(/^(con|prn|aux|nul|com\d|lpt\d)$/i)) ||
      // 其他系统特定规则
      fileName === '$RECYCLE.BIN' ||
      fileName === 'System Volume Information'
    )
  }

  /**
   * 递归读取目录内容
   * @param path - 目录路径
   * @returns Promise<LocalFile[]>
   */
  async function readDirectory(path: string): Promise<LocalFile[]> {
    try {
      if (shouldIgnorePath(path)) {
        return []
      }

      const files = await window.electron.readDirectory(path) as FileInfo[]
      const allFiles: LocalFile[] = []

      // 先添加所有目录（不递归）
      const directories = files.filter(f => 
        f.isDirectory && !shouldIgnorePath(f.path)
      )
      
      for (const dir of directories) {
        allFiles.push({
          path: dir.path,
          name: dir.name,
          lastModified: dir.lastModified,
          isDirectory: true
        })

        // 递归读取子目录
        const subFiles = await readDirectory(dir.path)
        allFiles.push(...subFiles)
      }

      // 再添加当前目录下的 Markdown 文件
      const mdFiles = files.filter(f => 
        !f.isDirectory && 
        f.name.endsWith('.md') &&
        !shouldIgnorePath(f.path)
      )
      
      allFiles.push(...mdFiles.map(file => ({
        path: file.path,
        name: file.name,
        lastModified: file.lastModified,
        isDirectory: false
      })))

      return allFiles.sort((a, b) => {
        if (a.isDirectory === b.isDirectory) {
          return a.name.localeCompare(b.name)
        }
        return a.isDirectory ? -1 : 1
      })

    } catch (error) {
      console.error('Failed to read directory:', error)
      return []
    }
  }

  /**
   * 打开本地文件
   * @param file - 本地文件信息
   * @returns Promise<void>
   */
  async function openFile(file: LocalFile): Promise<void> {
    try {
      const content = await window.electron.readFile(file.path)
      const store = useStore()
      
      // 创建新的文档对象
      const newPost = {
        title: file.name,
        content: content,
        path: file.path,
        lastModified: file.lastModified
      }

      // 检查是否已存在同路径的文档
      const existingIndex = store.posts.findIndex(p => 
        'path' in p && p.path === file.path
      )
      if (existingIndex !== -1) {
        // 如果存在，更新现有文档
        store.posts[existingIndex] = newPost
        store.currentPostIndex = existingIndex
      } else {
        // 如果不存在，添加新文档
        store.posts.push(newPost)
        store.currentPostIndex = store.posts.length - 1
      }

      toast.success('文件打开成功')
    } catch (error) {
      console.error('Failed to open file:', error)
      toast.error('文件打开失败')
    }
  }

  /**
   * 保存文件内容
   * @param path - 文件路径
   * @param content - 文件内容
   * @returns Promise<void>
   */
  async function saveFile(path: string, content: string): Promise<void> {
    try {
      await window.electron.writeFile(path, content)
      // 暂时使用 console.error 替代 toast
    } catch (error) {
      console.error('Failed to save file:', error)
      // 暂时使用 console.error 替代 toast
    }
  }

  return {
    state,
    switchMode,
    openDirectory,
    switchDirectory,
    readDirectory,
    openFile,
    saveFile
  }
}) 