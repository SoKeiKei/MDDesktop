import { Ref, ComponentPublicInstance } from 'vue'
import { StoreDefinition } from 'pinia'

declare global {
  // Vue Composition API
  const ref: typeof import('vue')['ref']
  const computed: typeof import('vue')['computed']
  const watch: typeof import('vue')['watch']
  const onMounted: typeof import('vue')['onMounted']
  const onBeforeMount: typeof import('vue')['onBeforeMount']
  const nextTick: typeof import('vue')['nextTick']
  const toRaw: typeof import('vue')['toRaw']
  const markRaw: typeof import('vue')['markRaw']
  
  // Pinia
  const defineStore: typeof import('pinia')['defineStore']
  const storeToRefs: typeof import('pinia')['storeToRefs']
  
  // VueUse
  const useStorage: typeof import('@vueuse/core')['useStorage']
  const useToggle: typeof import('@vueuse/core')['useToggle']
  const useTemplateRef: typeof import('@vueuse/core')['useTemplateRef']
  const useClipboard: typeof import('@vueuse/core')['useClipboard']
  
  // Toast
  const toast: {
    success: (message: string) => void
    error: (message: string) => void
    warning: (message: string) => void
  }
}

// 确保这个文件被视为模块
export {} 