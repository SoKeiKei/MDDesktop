<script setup lang="ts">
import { useStore } from '@/stores'
import { useLocalDirectoryStore } from '@/stores/useLocalDirectoryStore'
import { storeToRefs } from 'pinia'
import { DocumentMode } from '@/types/localDirectory'
import { Edit3, Ellipsis, Plus, Trash, FolderClosed, ChevronUp } from 'lucide-vue-next'
import LocalFileList from './LocalFileList.vue'
import { onMounted, nextTick, computed, watch, ref, onUnmounted } from 'vue'
import { 
  Tooltip, 
  TooltipContent, 
  TooltipTrigger,
  TooltipProvider 
} from '@/components/ui/tooltip'

const store = useStore()
const localDirStore = useLocalDirectoryStore()
const { state: localState } = storeToRefs(localDirStore)

// 添加调试日志
if (import.meta.env.DEV) {
  watch(() => localState.value, (newState) => {
    console.log('PostSlider localState changed:', newState)
  }, { deep: true, immediate: true })
}

// 使用 localState 的 currentMode 作为当前标签页
const currentTab = computed(() => {
  const mode = localState.value.currentMode
  if (import.meta.env.DEV) {
    console.log('Current tab computed:', mode)
  }
  return mode
})

// 处理标签切换
function handleTabChange(tab: DocumentMode): void {
  if (import.meta.env.DEV) {
    console.log('Tab change:', tab)
  }
  localDirStore.switchMode(tab)
}

// 内存文档面板展开状态
const isMemoryPanelExpanded = ref(false)

// 修改回 ref，但使用 watch 来监听展开状态
const memoryPanelHeight = ref(32) // 默认高度为标题栏高度

// 监听展开状态变化
watch(isMemoryPanelExpanded, (expanded) => {
  if (expanded) {
    memoryPanelHeight.value = 300 // 展开时设置为默认展开高度
  } else {
    memoryPanelHeight.value = 32 // 收起时设置为标题栏高度
  }
})

const isDragging = ref(false)
const startY = ref(0)
const startHeight = ref(0)

// 使用 RAF 优化拖动性能
let rafId: number | null = null

// 开始拖动
function startDrag(e: MouseEvent) {
  if (!isMemoryPanelExpanded.value) return // 未展开时不允许拖动
  
  isDragging.value = true
  startY.value = e.clientY
  startHeight.value = memoryPanelHeight.value
  
  // 添加全局事件监听
  document.addEventListener('mousemove', onDrag)
  document.addEventListener('mouseup', stopDrag)
  
  // 添加拖动时的鼠标样式
  document.body.style.cursor = 'row-resize'
  document.body.style.userSelect = 'none'
}

// 拖动中
function onDrag(e: MouseEvent) {
  if (!isDragging.value) return
  
  // 如果已经有待处理的 RAF，取消它
  if (rafId !== null) {
    cancelAnimationFrame(rafId)
  }
  
  // 使用 RAF 处理高度更新
  rafId = requestAnimationFrame(() => {
    const delta = startY.value - e.clientY
    const newHeight = Math.min(Math.max(startHeight.value + delta, 100), window.innerHeight - 200)
    memoryPanelHeight.value = newHeight
    rafId = null
  })
}

// 停止拖动
function stopDrag() {
  isDragging.value = false
  
  // 取消可能存在的 RAF
  if (rafId !== null) {
    cancelAnimationFrame(rafId)
    rafId = null
  }
  
  // 移除全局事件监听
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
  
  // 恢复鼠标样式
  document.body.style.cursor = ''
  document.body.style.userSelect = ''
}

// 组件卸载时清理
onUnmounted(() => {
  if (rafId !== null) {
    cancelAnimationFrame(rafId)
  }
  document.removeEventListener('mousemove', onDrag)
  document.removeEventListener('mouseup', stopDrag)
})

// 确保组件挂载时内容可见
onMounted(() => {
  if (import.meta.env.DEV) {
    console.log('PostSlider mounted, current state:', localState.value)
  }

  // 默认打开侧边栏
  store.isOpenPostSlider = true
  
  // 从存储中恢复上次的状态
  nextTick(() => {
    if (import.meta.env.DEV) {
      console.log('Restoring state, current mode:', localState.value.currentMode)
    }

    // 强制触发一次标签切换，确保内容显示
    handleTabChange(localState.value.currentMode)
  })
})

const isOpen = ref(false)

const addPostInputVal = ref(``)

watch(isOpen, () => {
  if (isOpen.value) {
    addPostInputVal.value = ``
  }
})

function addPost() {
  if (addPostInputVal.value === ``) {
    toast.error(`内容标题不可为空`)
    return
  }
  store.addPost(addPostInputVal.value)
  isOpen.value = false
  toast.success(`内容新增成功`)
}

const editTarget = ref(-1)
const isOpenEditDialog = ref(false)
const renamePostInputVal = ref(``)
function startRenamePost(index: number) {
  editTarget.value = index
  renamePostInputVal.value = store.posts[index].title
  isOpenEditDialog.value = true
}

function renamePost() {
  if (renamePostInputVal.value === ``) {
    toast.error(`内容标题不可为空`)
    return
  }
  store.renamePost(editTarget.value, renamePostInputVal.value)
  isOpenEditDialog.value = false
  toast.success(`内容重命名成功`)
}

const isOpenDelPostConfirmDialog = ref(false)
function startDelPost(index: number) {
  editTarget.value = index
  isOpenDelPostConfirmDialog.value = true
}
function delPost() {
  store.delPost(editTarget.value)
  isOpenDelPostConfirmDialog.value = false
  toast.success(`内容删除成功`)
}

// 切换面板展开状态
function toggleMemoryPanel() {
  isMemoryPanelExpanded.value = !isMemoryPanelExpanded.value
}

// 简化路径显示函数
function formatPath(path: string): string {
  if (!path) return ''
  
  const parts = path.split('\\')
  if (parts.length < 4) return path
  
  return `${parts[0]}\\...\\${parts[parts.length - 1]}`
}
</script>

<template>
  <div
    class="overflow-hidden bg-gray/20 transition-width duration-300 dark:bg-[#191c20]"
    :class="{
      'w-0': !store.isOpenPostSlider,
      'w-50': store.isOpenPostSlider,
    }"
  >
    <nav
      class="flex flex-col h-full border-r-2 border-gray/20 transition-transform"
      :class="{
        'translate-x-100': store.isOpenPostSlider,
        '-translate-x-full': !store.isOpenPostSlider,
      }"
    >
      <!-- 主要内容区域 -->
      <div class="flex-1 flex flex-col overflow-hidden">
        <!-- 文件管理头部 -->
        <div class="flex items-center justify-between px-3 py-2 border-b">
          <!-- 当前目录路径 -->
          <div class="flex-1 min-w-0">
            <div v-if="localState.currentDir" class="text-xs text-gray-500">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger class="truncate block">
                    {{ formatPath(localState.currentDir) }}
                  </TooltipTrigger>
                  <TooltipContent>
                    <p class="text-xs">{{ localState.currentDir }}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div v-else class="text-xs text-gray-400">
              请选择目录
            </div>
          </div>
          
          <!-- 切换目录按钮 -->
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost"
                  size="icon-xs"
                  class="ml-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  @click="localDirStore.openDirectory()"
                >
                  <FolderClosed class="size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p class="text-xs">
                  {{ localState.currentDir ? '更换目录' : '打开目录' }}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <!-- 本地文件列表 -->
        <LocalFileList class="flex-1 overflow-auto" />
      </div>

      <!-- 拖动手柄 -->
      <div
        v-show="isMemoryPanelExpanded"
        class="h-1.5 bg-gray-200/50 dark:bg-gray-700/50 hover:bg-gray-300 dark:hover:bg-gray-600 cursor-row-resize transition-colors group"
        @mousedown="startDrag"
      >
        <div class="h-full w-16 mx-auto opacity-0 group-hover:opacity-100 bg-gray-400/30 dark:bg-gray-500/30 rounded transition-opacity" />
      </div>

      <!-- 内存文档面板 -->
      <div
        class="border-t bg-white dark:bg-gray-800 overflow-hidden transition-all duration-200"
        :style="{ height: `${memoryPanelHeight}px` }"
      >
        <!-- 内存文档标题栏 -->
        <div 
          class="h-8 px-2 flex items-center justify-between cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800"
          @click="toggleMemoryPanel"
        >
          <div class="flex items-center space-x-2">
            <ChevronUp
              class="size-4 transition-transform"
              :class="{ 'rotate-180': !isMemoryPanelExpanded }"
            />
            <span class="text-sm font-medium">内存文档</span>
          </div>
          <Button
            v-show="isMemoryPanelExpanded"
            variant="ghost"
            size="icon-xs"
            @click.stop="isOpen = true"
          >
            <Plus class="size-4" />
          </Button>
        </div>

        <!-- 内存文档列表 -->
        <div 
          v-show="isMemoryPanelExpanded"
          class="p-2 space-y-1"
        >
          <Dialog v-model:open="isOpen">

            <DialogContent>
              <DialogHeader>
                <DialogTitle>新增内容</DialogTitle>
                <DialogDescription>
                  请输入内容名称
                </DialogDescription>
              </DialogHeader>
              <Input v-model="addPostInputVal" />
              <DialogFooter>
                <Button @click="addPost()">
                  确 定
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <a
            v-for="(post, index) in store.posts"
            :key="post.title"
            href="#"
            :class="[
              'h-8 w-full inline-flex items-center justify-start gap-2 whitespace-nowrap rounded px-2 text-sm transition-colors hover:bg-gray-100 dark:hover:bg-gray-800',
              store.currentPostIndex === index 
                ? 'text-blue-600 dark:text-blue-400 font-medium'
                : 'text-gray-700 dark:text-gray-200'
            ]"
            @click="store.currentPostIndex = index"
          >
            <span class="line-clamp-1">{{ post.title }}</span>
            <DropdownMenu>
              <DropdownMenuTrigger as-child>
                <Button 
                  size="xs" 
                  variant="ghost" 
                  class="ml-auto px-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <Ellipsis class="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem @click.stop="startRenamePost(index)">
                  <Edit3 class="mr-2 size-4" />
                  重命名
                </DropdownMenuItem>
                <DropdownMenuItem 
                  v-if="store.posts.length > 1" 
                  @click.stop="startDelPost(index)"
                  class="text-red-600 dark:text-red-400"
                >
                  <Trash class="mr-2 size-4" />
                  删除
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </a>
        </div>
      </div>

      <!-- 重命名弹窗 -->
      <Dialog v-model:open="isOpenEditDialog">
        <DialogContent class="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>编辑内容名称</DialogTitle>
            <DialogDescription>
              请输入新的内容名称
            </DialogDescription>
          </DialogHeader>
          <Input v-model="renamePostInputVal" />
          <DialogFooter>
            <Button variant="outline" @click="isOpenEditDialog = false">
              取消
            </Button>
            <Button @click="renamePost()">
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog v-model:open="isOpenDelPostConfirmDialog">
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>提示</AlertDialogTitle>
            <AlertDialogDescription>
              此操作将删除该内容，是否继续？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction @click="delPost()">
              确认
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </nav>
  </div>
</template>

<style scoped>
.overflow-auto {
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 0, 0, 0.2) transparent;
}

.overflow-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-auto::-webkit-scrollbar-track {
  background: transparent;
}

.overflow-auto::-webkit-scrollbar-thumb {
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 3px;
}

/* 拖动时禁用文本选择 */
.dragging {
  user-select: none;
}

/* 平滑过渡 */
.transition-all {
  transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 拖动时禁用过渡效果 */
.dragging .transition-all {
  transition: none;
}

/* 拖动手柄悬停效果 */
.hover\:bg-gray-300:hover {
  background-color: rgba(209, 213, 219, 1);
}

/* 深色模式下的拖动手柄 */
:global(.dark) .hover\:bg-gray-600:hover {
  background-color: rgba(75, 85, 99, 1);
}

/* 确保内容不会溢出 */
.overflow-auto {
  overflow-y: auto;
  overflow-x: hidden;
}

/* 优化图标旋转动画 */
.rotate-180 {
  transform: rotate(180deg);
}

/* 优化拖动时的性能 */
.dragging * {
  pointer-events: none;
}

/* 优化文档列表项的过渡效果 */
a {
  transition: all 0.2s ease;
}

/* 优化删除按钮的悬停效果 */
.text-red-600:hover {
  background-color: rgb(254, 242, 242);
}

:global(.dark) .text-red-400:hover {
  background-color: rgb(127, 29, 29, 0.1);
}

/* 优化头部按钮悬停效果 */
.hover\:text-gray-700:hover {
  @apply bg-gray-100 dark:bg-gray-800;
  border-radius: theme('borderRadius.md');
}
</style>
