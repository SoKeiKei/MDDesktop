<script setup lang="ts">
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close'])

const version = '1.1.1'

function onUpdate(val: boolean) {
  if (!val) {
    emit('close')
  }
}

const links = [
  { label: 'GitHub 仓库', url: 'https://github.com/SoKeiKei/MDDesktop' },
]

function onRedirect(url: string) {
  window.open(url, '_blank')
}
</script>

<template>
  <Dialog :open="visible" @update:open="onUpdate">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>关于</DialogTitle>
      </DialogHeader>
      <div class="flex flex-col gap-4">
        <div class="flex items-center gap-4">
          <img src="/resources/icons/icon-128.png" alt="logo" class="h-16 w-16">
          <div>
            <h2 class="text-lg font-medium">MD Desktop</h2>
            <p class="text-sm text-gray-500">v{{ version }}</p>
          </div>
        </div>
        <div class="text-sm text-gray-500">
          <p class="mb-2">基于 doocs/md 二次开发的桌面版微信 Markdown 编辑器</p>
          <p class="mb-2">开发者: KeiKo </p>
          <p class="mb-2">
            项目开源地址：
            <a href="https://github.com/doocs/md" target="_blank"
              class="text-blue-500 hover:text-blue-600">https://github.com/doocs/md</a>
            <br>
            桌面版开源地址：
            <a href="https://github.com/SoKeiKei/MDDesktop" target="_blank"
              class="text-blue-500 hover:text-blue-600">https://github.com/SoKeiKei/MDDesktop</a>
          </p>
          <p>
            如果你觉得这个项目帮助到了你，欢迎
            <a href="https://github.com/doocs/md/stargazers" target="_blank"
              class="text-blue-500 hover:text-blue-600">给原项目点个 Star</a>！
          </p>
        </div>
      </div>
      <DialogFooter class="sm:justify-center">
        <Button v-for="link in links" :key="link.url" @click="onRedirect(link.url)">
          {{ link.label }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
