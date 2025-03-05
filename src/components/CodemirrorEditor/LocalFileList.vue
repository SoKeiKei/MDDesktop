<script setup lang="ts">
import { useLocalDirectoryStore } from '@/stores/useLocalDirectoryStore'
import { storeToRefs } from 'pinia'
import type { LocalFile } from '@/types/localDirectory'
import { watch, onMounted, computed, ref } from 'vue'
import { File, FolderClosed, ChevronRight, ChevronDown } from 'lucide-vue-next'
import { useStore } from '@/stores'
import { 
  Tooltip, 
  TooltipContent, 
  TooltipTrigger,
  TooltipProvider 
} from '@/components/ui/tooltip'

const store = useStore()
const localDirStore = useLocalDirectoryStore()
const { state } = storeToRefs(localDirStore)

// 只在开发环境下保留监听
if (import.meta.env.DEV) {
  watch(state, (newState) => {
    console.log('LocalFileList state changed:', newState)
  }, { deep: true, immediate: true })

  onMounted(() => {
    console.log('LocalFileList mounted, state:', state.value)
  })
}

// 存储展开状态的 Map
const expandedDirs = ref(new Map<string, boolean>())

// 添加路径处理工具函数
function normalizePath(path: string) {
  return path.replace(/\\/g, '/')
}

function getParentPath(path: string) {
  const normalized = normalizePath(path)
  return normalized.substring(0, normalized.lastIndexOf('/'))
}

// 修改文件过滤逻辑
function getDirectoryFiles(dirPath: string) {
  console.log('Getting files for directory:', dirPath)
  console.log('All files:', state.value?.localFiles)
  
  const files = (state.value?.localFiles || []).filter(f => {
    if (!f || f.isDirectory) return false
    
    const parentDir = f.path.substring(0, f.path.lastIndexOf('\\')).replace(/\\/g, '/')
    const targetDir = dirPath.replace(/\\/g, '/')
    
    const isMatch = parentDir === targetDir
    
    console.log('File check:', {
      file: f.path,
      parentDir,
      targetDir,
      isMatch
    })
    
    return isMatch
  })
  
  console.log('Filtered files:', files)
  return files
}

// 获取所有目录
const directories = computed(() => {
  console.log('Computing directories from:', state.value?.localFiles)
  return (state.value?.localFiles || []).filter(f => {
    if (import.meta.env.DEV) {
      console.log('Directory check:', {
        path: f?.path,
        isDirectory: f?.isDirectory,
        name: f?.name,
        raw: f
      })
    }
    return f?.isDirectory === true
  })
})

// 获取目录下的内容（包括子目录和文件）
function getDirectoryContents(dirPath: string) {
  // 只在开发环境下输出一次目录内容的日志
  if (import.meta.env.DEV) {
    console.debug('Getting contents for directory:', dirPath)
  }
  
  return (state.value?.localFiles || []).filter(f => {
    if (!f) return false
    
    const parentDir = f.path.substring(0, f.path.lastIndexOf('\\')).replace(/\\/g, '/')
    const targetDir = dirPath.replace(/\\/g, '/')
    
    const isDirectChild = parentDir === targetDir
    
    // 只在开发环境且需要调试具体文件时才输出
    if (import.meta.env.DEV && false) { // 设置为 true 开启详细日志
      console.debug('Content check:', {
        file: f.path,
        parentDir,
        targetDir,
        isDirectChild
      })
    }
    
    return isDirectChild
  }).sort((a, b) => {
    if (a.isDirectory !== b.isDirectory) {
      return a.isDirectory ? -1 : 1
    }
    return a.name.localeCompare(b.name)
  })
}

// 获取根目录内容
const rootContents = computed(() => {
  if (!state.value?.currentDir) return []
  
  return getDirectoryContents(state.value.currentDir)
})

// 切换目录展开状态
function toggleDir(path: string) {
  console.log('Toggling directory:', path)
  console.log('Current expanded state:', expandedDirs.value.get(path))
  expandedDirs.value.set(path, !expandedDirs.value.get(path))
  console.log('New expanded state:', expandedDirs.value.get(path))
  console.log('All expanded dirs:', Object.fromEntries(expandedDirs.value))
}

// 处理文件点击
async function handleFileClick(file: LocalFile) {
  if (!file?.isDirectory) {
    await localDirStore.openFile(file)
  }
}

// 获取相对路径显示
function getDisplayPath(path: string) {
  return path?.replace(state.value?.currentDir + '\\', '') || ''
}

// 添加一个计算属性来获取缩进级别
function getIndentLevel(path: string): number {
  if (!state.value?.currentDir) return 0
  const relativePath = path.replace(state.value.currentDir, '').split('\\').filter(Boolean)
  return relativePath.length
}

// 获取当前打开的文档路径
const currentFilePath = computed(() => {
  const currentPost = store.posts[store.currentPostIndex]
  return 'path' in currentPost ? currentPost.path : null
})

// 检查文件是否为当前打开的文件
function isCurrentFile(file: LocalFile): boolean {
  return file.path === currentFilePath.value
}
</script>

<template>
  <div class="h-full overflow-auto border-t bg-gray-50/30 dark:bg-gray-900/30">
    <div class="p-2 space-y-0.5">
      <template v-if="state?.localFiles?.length > 0">
        <!-- 根目录内容 -->
        <template v-for="item in rootContents" :key="item.path">
          <!-- 如果是目录 -->
          <template v-if="item.isDirectory">
            <div
              class="group flex items-center px-2 py-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors duration-150"
              @click="toggleDir(item.path)"
            >
              <div class="flex-none flex items-center">
                <component
                  :is="expandedDirs.get(item.path) ? ChevronDown : ChevronRight"
                  class="size-3.5 mr-1 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors"
                />
                <FolderClosed 
                  class="size-4 mr-2 text-blue-500/70 group-hover:text-blue-500 transition-colors" 
                />
              </div>
              <span class="text-[13px] font-medium text-gray-700 dark:text-gray-200 truncate">{{ item.name }}</span>
            </div>

            <!-- 展开的目录内容 -->
            <div
              v-if="expandedDirs.get(item.path)"
              class="ml-1.5 space-y-0.5 border-l border-gray-200/70 dark:border-gray-700/70 pl-1.5 my-0.5"
            >
              <template v-for="subItem in getDirectoryContents(item.path)" :key="subItem.path">
                <!-- 子目录 -->
                <template v-if="subItem.isDirectory">
                  <div
                    class="group flex items-center px-2 py-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors duration-150"
                    @click="toggleDir(subItem.path)"
                  >
                    <div class="flex-none flex items-center">
                      <component
                        :is="expandedDirs.get(subItem.path) ? ChevronDown : ChevronRight"
                        class="size-3.5 mr-1 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors"
                      />
                      <FolderClosed 
                        class="size-4 mr-2 text-blue-500/70 group-hover:text-blue-500 transition-colors" 
                      />
                    </div>
                    <span class="text-[13px] font-medium text-gray-700 dark:text-gray-200 truncate">{{ subItem.name }}</span>
                  </div>

                  <!-- 递归显示子目录内容 -->
                  <div
                    v-if="expandedDirs.get(subItem.path)"
                    class="ml-1.5 space-y-0.5 border-l border-gray-200/70 dark:border-gray-700/70 pl-1.5 my-0.5"
                  >
                    <template v-for="subSubItem in getDirectoryContents(subItem.path)" :key="subSubItem.path">
                      <div
                        class="group flex items-center px-2 py-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors duration-150 min-w-0"
                        @click="subSubItem.isDirectory ? toggleDir(subSubItem.path) : handleFileClick(subSubItem)"
                      >
                        <div class="flex-none flex items-center">
                          <template v-if="subSubItem.isDirectory">
                            <component
                              :is="expandedDirs.get(subSubItem.path) ? ChevronDown : ChevronRight"
                              class="size-3.5 mr-1 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors"
                            />
                            <FolderClosed 
                              class="size-4 mr-2 text-blue-500/70 group-hover:text-blue-500 transition-colors" 
                            />
                          </template>
                          <template v-else>
                            <div class="w-3.5 mr-1" />
                            <File 
                              class="size-4 mr-2 transition-colors" 
                              :class="[
                                isCurrentFile(subSubItem)
                                  ? 'text-blue-500'
                                  : 'text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300'
                              ]"
                            />
                          </template>
                        </div>
                        <div class="flex-1 min-w-0">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger class="block w-full text-left">
                                <div 
                                  class="text-[13px] truncate"
                                  :class="[
                                    isCurrentFile(subSubItem)
                                      ? 'text-blue-600 dark:text-blue-400 font-medium'
                                      : 'text-gray-700 dark:text-gray-200'
                                  ]"
                                >
                                  {{ subSubItem.name }}
                                </div>
                              </TooltipTrigger>
                              <TooltipContent side="right" align="start">
                                <p class="text-xs">{{ subSubItem.name }}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <div class="text-[11px] text-gray-400 dark:text-gray-500 truncate">
                            {{ new Date(subSubItem.lastModified).toLocaleString() }}
                          </div>
                        </div>
                      </div>
                    </template>
                  </div>
                </template>
                <!-- 文件 -->
                <template v-else>
                  <div
                    class="group flex items-center px-2 py-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors duration-150 min-w-0"
                    @click="handleFileClick(subItem)"
                  >
                    <div class="flex-none flex items-center">
                      <div class="w-3.5 mr-1" />
                      <File 
                        class="size-4 mr-2 transition-colors" 
                        :class="[
                          isCurrentFile(subItem)
                            ? 'text-blue-500'
                            : 'text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300'
                        ]"
                      />
                    </div>
                    <div class="flex-1 min-w-0">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger class="block w-full text-left">
                            <div 
                              class="text-[13px] truncate"
                              :class="[
                                isCurrentFile(subItem)
                                  ? 'text-blue-600 dark:text-blue-400 font-medium'
                                  : 'text-gray-700 dark:text-gray-200'
                              ]"
                            >
                              {{ subItem.name }}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="right" align="start">
                            <p class="text-xs">{{ subItem.name }}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <div class="text-[11px] text-gray-400 dark:text-gray-500 truncate">
                        {{ new Date(subItem.lastModified).toLocaleString() }}
                      </div>
                    </div>
                  </div>
                </template>
              </template>
            </div>
          </template>
          <!-- 如果是文件 -->
          <template v-else>
            <div
              class="group flex items-center px-2 py-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer transition-colors duration-150 min-w-0"
              @click="handleFileClick(item)"
            >
              <div class="flex-none flex items-center">
                <div class="w-3.5 mr-1" />
                <File 
                  class="size-4 mr-2 transition-colors" 
                  :class="[
                    isCurrentFile(item)
                      ? 'text-blue-500'
                      : 'text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300'
                  ]"
                />
              </div>
              <div class="flex-1 min-w-0">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger class="block w-full text-left">
                      <div 
                        class="text-[13px] truncate"
                        :class="[
                          isCurrentFile(item)
                            ? 'text-blue-600 dark:text-blue-400 font-medium'
                            : 'text-gray-700 dark:text-gray-200'
                        ]"
                      >
                        {{ item.name }}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="right" align="start">
                      <p class="text-xs">{{ item.name }}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <div class="text-[11px] text-gray-400 dark:text-gray-500 truncate">
                  {{ new Date(item.lastModified).toLocaleString() }}
                </div>
              </div>
            </div>
          </template>
        </template>
      </template>

      <!-- 空状态 -->
      <div v-else class="flex items-center justify-center h-32 text-[13px] text-gray-500 dark:text-gray-400">
        {{ state?.currentDir ? '当前目录下没有 Markdown 文件' : '请选择一个目录' }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.overflow-auto {
  overflow-y: auto;
  max-height: calc(100vh - 120px);
}

.overflow-auto::-webkit-scrollbar {
  width: 4px;
}

.overflow-auto::-webkit-scrollbar-track {
  background: transparent;
}

.overflow-auto::-webkit-scrollbar-thumb {
  background-color: rgba(156, 163, 175, 0.2);
  border-radius: 4px;
}

.overflow-auto::-webkit-scrollbar-thumb:hover {
  background-color: rgba(156, 163, 175, 0.4);
}

/* 深色模式滚动条 */
:global(.dark) .overflow-auto::-webkit-scrollbar-thumb {
  background-color: rgba(156, 163, 175, 0.15);
}

:global(.dark) .overflow-auto::-webkit-scrollbar-thumb:hover {
  background-color: rgba(156, 163, 175, 0.25);
}

/* 添加平滑过渡效果 */
.group {
  transition: all 0.2s ease;
}

/* 优化深色模式下的高亮颜色 */
:global(.dark) .bg-blue-50 {
  background-color: rgba(59, 130, 246, 0.1);
}
</style> 