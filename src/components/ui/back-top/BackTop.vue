<script setup lang="ts">
import { throttle } from 'es-toolkit'
import { ArrowUpFromLine } from 'lucide-vue-next'

type Target = HTMLElement | Window | null

const props = defineProps<{
  left?: number
  top?: number
  right?: number
  bottom?: number
  visibilityHeight?: number
  target?: string
  onClick?: (e: MouseEvent) => void
}>()

const visibilityHeight = ref(props.visibilityHeight ?? 400)
const visible = ref(false)

const target = ref<Target>(null)

function smoothScrollToTop(element: HTMLElement | Window, duration = 300) {
  const start = element instanceof Window ? window.scrollY : (element as HTMLElement).scrollTop
  const startTime = performance.now()
  
  function scroll() {
    const currentTime = performance.now()
    const time = Math.min(1, (currentTime - startTime) / duration)
    
    // easeInOutQuad 缓动函数
    const easedTime = time < 0.5 
      ? 2 * time * time 
      : -1 + (4 - 2 * time) * time
    
    if(element instanceof Window) {
      window.scrollTo(0, start * (1 - easedTime))
    } else {
      (element as HTMLElement).scrollTop = start * (1 - easedTime)
    }
    
    if(time < 1) {
      requestAnimationFrame(scroll)
    }
  }
  
  requestAnimationFrame(scroll)
}

function scrollToTop(e: MouseEvent) {
  if(target.value) {
    smoothScrollToTop(target.value)
  }
  props.onClick?.(e)
}

const throttledScroll = throttle((el: Target) => {
  if (el instanceof HTMLElement) {
    visible.value = el.scrollTop > visibilityHeight.value
  }
  else {
    visible.value = window.scrollY > visibilityHeight.value
  }
}, 200, { edges: [`leading`, `trailing`] })

onMounted(() => {
  if (props.target) {
    target.value = document.getElementById(props.target)
  }
  else {
    target.value = window
  }

  target.value!.addEventListener(`scroll`, () => {
    throttledScroll(target.value)
  })
})

onUnmounted(() => {
  target.value!.removeEventListener(`scroll`, () => {
    throttledScroll(target.value)
  })
})
</script>

<template>
  <Button v-if="visible" variant="outline" size="icon" class="fixed z-50 rounded-full" :style="{ left: `${left}px`, top: `${top}px`, right: `${right}px`, bottom: `${bottom}px` }" @click="scrollToTop">
    <ArrowUpFromLine />
  </Button>
</template>
