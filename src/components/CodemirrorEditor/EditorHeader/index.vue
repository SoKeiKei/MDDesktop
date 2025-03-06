<script setup lang="ts">
import { toast } from 'vue-sonner'
import {
  altSign,
  ctrlKey,
  ctrlSign,
  shiftSign,
} from '@/config'
import { useStore } from '@/stores'
import { useDisplayStore } from '@/stores'
import { addPrefix, processClipboardContent } from '@/utils'
import { 
  Moon, 
  PanelLeftClose, 
  PanelLeftOpen, 
  Settings, 
  Sun,
  Bold,
  Italic,
  Strikethrough,
  Link,
  Code,
  FileSpreadsheet,
  FileText,
  Timer,
  ImagePlus,
  Table,
  ChevronDown,
  Heading,
  List,
  Quote,
  FileCode,
  SeparatorHorizontal,
  Image,
  Search,
  Replace,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
} from 'lucide-vue-next'
import AboutDialog from './AboutDialog.vue'

const emit = defineEmits([`addFormat`, `formatContent`, `startCopy`, `endCopy`])

const formatItems = [
  {
    label: `加粗`,
    kbd: [ctrlSign, `B`],
    emitArgs: [`addFormat`, `${ctrlKey}-B`],
  },
  {
    label: `斜体`,
    kbd: [ctrlSign, `I`],
    emitArgs: [`addFormat`, `${ctrlKey}-I`],
  },
  {
    label: `删除线`,
    kbd: [ctrlSign, `D`],
    emitArgs: [`addFormat`, `${ctrlKey}-D`],
  },
  {
    label: `超链接`,
    kbd: [ctrlSign, `K`],
    emitArgs: [`addFormat`, `${ctrlKey}-K`],
  },
  {
    label: `行内代码`,
    kbd: [ctrlSign, `E`],
    emitArgs: [`addFormat`, `${ctrlKey}-E`],
  },
  {
    label: `格式化`,
    kbd: [altSign, shiftSign, `F`],
    emitArgs: [`formatContent`],
  },
] as const

const store = useStore()
const displayStore = useDisplayStore()

const { isDark, isCiteStatus, isCountStatus, output, primaryColor, isOpenPostSlider } = storeToRefs(store)
const { toggleShowUploadImgDialog, toggleShowInsertFormDialog } = displayStore

const { toggleDark, editorRefresh, citeStatusChanged, countStatusChanged } = store

const copyMode = useStorage(addPrefix(`copyMode`), `txt`)
const source = ref(``)
const { copy: copyContent } = useClipboard({ source })

const visible = ref(false)

function handleAboutClick() {
  visible.value = true
}

// 复制到微信公众号
function copy() {
  emit(`startCopy`)
  setTimeout(() => {
    // 如果是深色模式，复制之前需要先切换到白天模式
    const isBeforeDark = isDark.value
    if (isBeforeDark) {
      toggleDark()
    }

    nextTick(async () => {
      processClipboardContent(primaryColor.value)
      const clipboardDiv = document.getElementById(`output`)!
      clipboardDiv.focus()
      window.getSelection()!.removeAllRanges()
      const temp = clipboardDiv.innerHTML
      if (copyMode.value === `txt`) {
        const range = document.createRange()
        range.setStartBefore(clipboardDiv.firstChild!)
        range.setEndAfter(clipboardDiv.lastChild!)
        window.getSelection()!.addRange(range)
        document.execCommand(`copy`)
        window.getSelection()!.removeAllRanges()
      }
      if (isBeforeDark) {
        nextTick(() => toggleDark())
      }
      if (copyMode.value === `html`) {
        await copyContent(temp)
      }

      // 延迟恢复内容和显示提示
      setTimeout(() => {
        clipboardDiv.innerHTML = output.value
        // 输出提示
        toast.success(
          copyMode.value === `html`
            ? `已复制 HTML 源码，请进行下一步操作。`
            : `已复制渲染后的内容到剪贴板，可直接到公众号后台粘贴。`,
          {
            duration: 3000
          }
        )
        editorRefresh()
        emit(`endCopy`)
      }, 800)
    })
  }, 350)
}
</script>

<template>
  <header class="header-container h-15 flex flex-col">
    <!-- 原有的菜单栏 -->
    <div class="flex items-center justify-between px-5 py-2">
      <div class="space-x-2 flex">
        <Menubar class="menubar">
          <FileDropdown />
          <StyleDropdown />
          <HelpDropdown />
        </Menubar>
        <div class="flex items-center space-x-0.5">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" class="h-8 w-8" @click="emit('addFormat', `${ctrlKey}-B`)">
                  <Bold class="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>加粗 ({{ ctrlSign }}+B)</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" class="h-8 w-8" @click="emit('addFormat', `${ctrlKey}-I`)">
                  <Italic class="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>斜体 ({{ ctrlSign }}+I)</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" class="h-8 w-8" @click="emit('addFormat', `${ctrlKey}-D`)">
                  <Strikethrough class="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>删除线 ({{ ctrlSign }}+D)</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" class="h-8 w-8">
                <Heading class="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem @click="emit('addFormat', 'h1')">
                <div class="flex items-center justify-between w-full">
                  <span class="font-bold">H1</span>
                  <span class="text-muted-foreground text-sm">一级标题 ({{ ctrlSign }}+1)</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem @click="emit('addFormat', 'h2')">
                <div class="flex items-center justify-between w-full">
                  <span class="font-bold">H2</span>
                  <span class="text-muted-foreground text-sm">二级标题 ({{ ctrlSign }}+2)</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem @click="emit('addFormat', 'h3')">
                <div class="flex items-center justify-between w-full">
                  <span class="font-bold">H3</span>
                  <span class="text-muted-foreground text-sm">三级标题 ({{ ctrlSign }}+3)</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem @click="emit('addFormat', 'h4')">
                <div class="flex items-center justify-between w-full">
                  <span class="font-bold">H4</span>
                  <span class="text-muted-foreground text-sm">四级标题</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem @click="emit('addFormat', 'h5')">
                <div class="flex items-center justify-between w-full">
                  <span class="font-bold">H5</span>
                  <span class="text-muted-foreground text-sm">五级标题</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem @click="emit('addFormat', 'h6')">
                <div class="flex items-center justify-between w-full">
                  <span class="font-bold">H6</span>
                  <span class="text-muted-foreground text-sm">六级标题</span>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" class="h-8 w-8">
                <List class="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent class="min-w-[130px]">
              <DropdownMenuItem @click="emit('addFormat', 'ul')">
                <div class="flex items-center justify-between w-full">
                  <span class="font-mono">-</span>
                  <span class="text-muted-foreground text-sm">无序列表 ({{ ctrlSign }}+U)</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem @click="emit('addFormat', 'ol')">
                <div class="flex items-center justify-between w-full">
                  <span class="font-mono">1.</span>
                  <span class="text-muted-foreground text-sm">有序列表 ({{ ctrlSign }}+O)</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem @click="emit('addFormat', 'task')">
                <div class="flex items-center justify-between w-full">
                  <span class="font-mono">- [ ]</span>
                  <span class="text-muted-foreground text-sm">任务列表 ({{ ctrlSign }}+T)</span>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" class="h-8 w-8">
                <AlignLeft class="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem @click="emit('addFormat', 'align-left')">
                <div class="flex items-center justify-between w-full">
                  <div class="flex items-center gap-2">
                    <AlignLeft class="h-4 w-4" />
                    <span>左对齐</span>
                  </div>
                  <span class="text-muted-foreground text-sm">{{ ctrlSign }}+[</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem @click="emit('addFormat', 'align-center')">
                <div class="flex items-center justify-between w-full">
                  <div class="flex items-center gap-2">
                    <AlignCenter class="h-4 w-4" />
                    <span>居中对齐</span>
                  </div>
                  <span class="text-muted-foreground text-sm">{{ ctrlSign }}+M</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem @click="emit('addFormat', 'align-right')">
                <div class="flex items-center justify-between w-full">
                  <div class="flex items-center gap-2">
                    <AlignRight class="h-4 w-4" />
                    <span>右对齐</span>
                  </div>
                  <span class="text-muted-foreground text-sm">{{ ctrlSign }}+]</span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem @click="emit('addFormat', 'align-justify')">
                <div class="flex items-center justify-between w-full">
                  <div class="flex items-center gap-2">
                    <AlignJustify class="h-4 w-4" />
                    <span>两端对齐</span>
                  </div>
                  <span class="text-muted-foreground text-sm">{{ ctrlSign }}+J</span>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" class="h-8 w-8" @click="emit('addFormat', `${ctrlKey}-K`)">
                  <Link class="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>超链接 ({{ ctrlSign }}+K)</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Separator orientation="vertical" class="h-4 mx-0.5" />

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" class="h-8 w-8" @click="emit('addFormat', 'quote')">
                  <Quote class="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>引用块 ({{ ctrlSign }}+Q)</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" class="h-8 w-8" @click="emit('addFormat', `${ctrlKey}-E`)">
                  <Code class="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>行内代码 ({{ ctrlSign }}+E)</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" class="h-8 w-8" @click="emit('addFormat', 'codeblock')">
                  <FileCode class="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>代码块 ({{ ctrlSign }}+{{ shiftSign }}+K)</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" class="h-8 w-8" @click="emit('addFormat', 'hr')">
                  <SeparatorHorizontal class="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>分隔线 ({{ ctrlSign }}+{{ shiftSign }}+H)</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Separator orientation="vertical" class="h-4 mx-0.5" />

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" class="h-8 w-8" @click="emit('addFormat', 'image')">
                  <Image class="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>图片链接 ({{ ctrlSign }}+{{ shiftSign }}+I)</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" class="h-8 w-8" @click="toggleShowUploadImgDialog">
                  <ImagePlus class="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>上传图片</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" class="h-8 w-8" @click="toggleShowInsertFormDialog">
                  <Table class="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>插入表格</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Separator orientation="vertical" class="h-4 mx-0.5" />

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" class="h-8 w-8" @click="emit('formatContent')">
                  <FileSpreadsheet class="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>格式化 ({{ altSign }}+{{ shiftSign }}+F)</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" class="h-8 w-8" @click="store.citeStatusChanged()">
                  <FileText class="h-4 w-4 transition-colors"
                    :class="store.isCiteStatus ? 'text-primary' : 'text-muted-foreground'" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  微信外链转底部引用
                  {{ store.isCiteStatus ? ' (已开启)' : '' }}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" class="h-8 w-8" @click="store.countStatusChanged()">
                  <Timer class="h-4 w-4 transition-colors"
                    :class="store.isCountStatus ? 'text-primary' : 'text-muted-foreground'" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  统计字数和阅读时间
                  {{ store.isCountStatus ? ' (已开启)' : '' }}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <Separator orientation="vertical" class="h-4 mx-0.5" />

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" class="h-8 w-8" @click="emit('addFormat', 'search')">
                  <Search class="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <div class="space-y-1 text-sm">
                  <p>查找 ({{ ctrlSign }}+F)</p>
                  <p class="text-muted-foreground">
                    {{ ctrlSign }}+G: 查找下一个<br>
                    {{ shiftSign }}+{{ ctrlSign }}+G: 查找上一个<br>
                    {{ ctrlSign }}+H: 打开替换<br>
                    ESC: 关闭搜索
                  </p>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" class="h-8 w-8" @click="emit('addFormat', 'replace')">
                  <Replace class="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <div class="space-y-1 text-sm">
                  <p>查找并替换 ({{ ctrlSign }}+H)</p>
                  <p class="text-muted-foreground">
                    1. 输入要查找的文本<br>
                    2. 输入要替换的文本<br>
                    Enter: 替换并查找下一个<br>
                    {{ shiftSign }}+Enter: 全部替换<br>
                    ESC: 关闭替换
                  </p>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      <div class="space-x-2 flex">
        <TooltipProvider :delay-duration="200">
          <Tooltip>
            <TooltipTrigger as-child>
              <Button variant="outline" @click="isOpenPostSlider = !isOpenPostSlider">
                <PanelLeftOpen v-show="!isOpenPostSlider" class="size-4" />
                <PanelLeftClose v-show="isOpenPostSlider" class="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">
              {{ isOpenPostSlider ? "关闭" : "内容管理" }}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <Button variant="outline" @click="toggleDark()">
          <Moon v-show="isDark" class="size-4" />
          <Sun v-show="!isDark" class="size-4" />
        </Button>

        <div class="bg-background space-x-1 text-background-foreground mx-2 flex items-center border rounded-md">
          <Button variant="ghost" class="shadow-none" @click="copy">
            复制
          </Button>
          <Separator orientation="vertical" class="h-5" />
          <DropdownMenu v-model="copyMode">
            <DropdownMenuTrigger as-child>
              <Button variant="ghost" class="px-2 shadow-none">
                <ChevronDown class="text-secondary-foreground h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" :align-offset="-5" class="w-[200px]">
              <DropdownMenuRadioGroup v-model="copyMode">
                <DropdownMenuRadioItem value="txt">
                  公众号格式
                </DropdownMenuRadioItem>
                <DropdownMenuRadioItem value="html">
                  HTML 格式
                </DropdownMenuRadioItem>
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <PostInfo />

        <Button variant="outline" @click="store.isOpenRightSlider = !store.isOpenRightSlider">
          <Settings class="size-4" />
        </Button>
      </div>
    </div>

    <AboutDialog :visible="visible" @close="visible = false" />
  </header>
</template>

<style lang="less" scoped>
.menubar {
  user-select: none;
}

kbd {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  border: 1px solid #a8a8a8;
  padding: 1px 4px;
  border-radius: 2px;
}
</style>
