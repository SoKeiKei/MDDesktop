<script setup lang="ts">
import type { TabsRootEmits, TabsRootProps } from 'radix-vue'
import { TabsRoot, useForwardPropsEmits } from 'radix-vue'
import { watch, nextTick } from 'vue'

interface Props {
  value?: string
  defaultValue?: string
  asChild?: boolean
}

const props = defineProps<Props>()
const emits = defineEmits<{
  'update:value': [value: string]  // 明确声明事件类型
}>()

const forwarded = useForwardPropsEmits(props, emits)

// 确保默认值立即生效
watch(() => props.value || props.defaultValue, (newValue) => {
  if (newValue) {
    nextTick(() => {
      emits('update:value', newValue)
    })
  }
}, { immediate: true })
</script>

<template>
  <TabsRoot v-bind="forwarded">
    <slot />
  </TabsRoot>
</template>
