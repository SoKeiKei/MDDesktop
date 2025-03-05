<script setup lang="ts">
import { useLocalDirectoryStore } from '@/stores/useLocalDirectoryStore'
import { storeToRefs } from 'pinia'
import type { LocalFile } from '@/types/localDirectory'
import { watch, onMounted } from 'vue'

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

async function handleFileClick(file: LocalFile) {
  await localDirStore.openFile(file)
}
</script>

<template>
  <div class="h-full overflow-auto border-t">
    <!-- 显示当前目录 -->
    <div v-if="state.currentDir" class="px-4 py-2 text-sm text-gray-500 border-b">
      当前目录: {{ state.currentDir }}
    </div>

    <!-- 文件列表 -->
    <div class="space-y-1 p-2">
      <template v-if="state.localFiles?.length > 0">
        <div
          v-for="file in state.localFiles"
          :key="file.path"
          class="flex items-center p-2 rounded hover:bg-gray-100 cursor-pointer border"
          @click="handleFileClick(file)"
        >
          <!-- 文件图标 -->
          <div class="mr-2">
            <i class="i-lucide-file-text text-gray-400" />
          </div>

          <!-- 文件名和修改时间 -->
          <div class="flex-1 min-w-0">
            <div class="text-sm truncate">{{ file.name }}</div>
            <div class="text-xs text-gray-500">
              {{ new Date(file.lastModified).toLocaleString() }}
            </div>
          </div>
        </div>
      </template>

      <!-- 空状态 -->
      <div v-else class="text-center text-gray-500 py-4">
        {{ state.currentDir ? '当前目录下没有 Markdown 文件' : '请选择一个目录' }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.overflow-auto {
  overflow-y: auto;
  max-height: calc(100vh - 120px); /* 留出顶部空间 */
}
</style> 