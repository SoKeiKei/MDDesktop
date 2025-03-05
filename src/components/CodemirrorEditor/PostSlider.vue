<script setup lang="ts">
import { useStore } from '@/stores'
import { useLocalDirectoryStore } from '@/stores/useLocalDirectoryStore'
import { storeToRefs } from 'pinia'
import { DocumentMode } from '@/types/localDirectory'
import { Edit3, Ellipsis, Plus, Trash, Files, ChevronUp } from 'lucide-vue-next'
import LocalFileList from './LocalFileList.vue'
import { onMounted, nextTick, computed, watch, ref } from 'vue'

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
        <div class="p-2 border-b">
          <Button 
            variant="outline" 
            class="w-full" 
            size="xs"
            @click="localDirStore.openDirectory()"
          >
            <Files class="size-4 mr-1" />
            {{ localState.currentDir ? '切换目录' : '打开目录' }}
          </Button>
        </div>

        <!-- 当前目录路径 -->
        <div v-if="localState.currentDir" class="text-xs text-gray-500 px-4 py-2 truncate border-b">
          {{ localState.currentDir }}
        </div>

        <!-- 本地文件列表 -->
        <LocalFileList class="flex-1 overflow-auto" />
      </div>

      <!-- 内存文档面板 -->
      <div 
        class="border-t transition-all duration-300"
        :class="{
          'h-8': !isMemoryPanelExpanded,
          'h-60': isMemoryPanelExpanded
        }"
      >
        <!-- 内存文档标题栏 -->
        <div 
          class="h-8 px-2 flex items-center justify-between cursor-pointer hover:bg-gray-100"
          @click="isMemoryPanelExpanded = !isMemoryPanelExpanded"
        >
          <span class="text-sm font-medium">内存文档</span>
          <ChevronUp 
            class="size-4 transition-transform"
            :class="{ 'rotate-180': !isMemoryPanelExpanded }"
          />
        </div>

        <!-- 内存文档内容 -->
        <div v-show="isMemoryPanelExpanded" class="h-[calc(100%-2rem)] overflow-auto p-2 space-y-1">
          <Dialog v-model:open="isOpen">
            <DialogTrigger as-child>
              <Button variant="outline" class="w-full" size="xs">
                <Plus /> 新增内容
              </Button>
            </DialogTrigger>
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
            :class="{
              'bg-primary text-primary-foreground': store.currentPostIndex === index,
            }"
            class="hover:bg-primary/90 hover:text-primary-foreground h-8 w-full inline-flex items-center justify-start gap-2 whitespace-nowrap rounded px-2 text-sm transition-colors"
            @click="store.currentPostIndex = index"
          >
            <span class="line-clamp-1">{{ post.title }}</span>
            <DropdownMenu>
              <DropdownMenuTrigger as-child>
                <Button size="xs" variant="ghost" class="ml-auto px-1.5">
                  <Ellipsis class="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem @click.stop="startRenamePost(index)">
                  <Edit3 class="mr-2 size-4" />
                  重命名
                </DropdownMenuItem>
                <DropdownMenuItem v-if="store.posts.length > 1" @click.stop="startDelPost(index)">
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
</style>
