import { defineStore } from 'pinia'
import { useStore } from '@/stores'
import { useStorage } from '@vueuse/core'
import { toast } from '@/utils/toast'  // 使用系统原有的 toast
import type { LocalDirectoryState, LocalDirectory, LocalFile } from '@/types/localDirectory'
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
   * 读取目录内容
   * @param path - 目录路径
   * @returns Promise<LocalFile[]>
   */
  async function readDirectory(path: string): Promise<LocalFile[]> {
    try {
      const files = await window.electron.readDirectory(path)
      const mdFiles = files
        .filter(file => file.name.endsWith('.md'))
        .map(file => ({
          path: file.path,
          name: file.name,
          lastModified: file.lastModified
        }))
      console.log('Loaded MD files:', mdFiles)
      return mdFiles
    } catch (error) {
      console.error('Failed to read directory:', error)
      toast.error('读取目录失败')
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
      // 这里需要和编辑器进行集成
      // TODO: 实现编辑器内容更新
      // 暂时使用 console.error 替代 toast
    } catch (error) {
      console.error('Failed to open file:', error)
      // 暂时使用 console.error 替代 toast
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