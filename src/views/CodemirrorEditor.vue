<script setup lang="ts">
import type { ComponentPublicInstance } from 'vue'
import { altKey, altSign, ctrlKey, shiftKey, shiftSign } from '@/config'
import { useDisplayStore, useStore } from '@/stores'
import {
  checkImage,
  formatDoc,
  toBase64,
} from '@/utils'
import fileApi from '@/utils/file'
import CodeMirror from 'codemirror'
import { useLocalDirectoryStore } from '@/stores/useLocalDirectoryStore'
import { Button } from '@/components/ui/button'
import { Smartphone, Monitor } from 'lucide-vue-next'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

const store = useStore()
const displayStore = useDisplayStore()
const localDirStore = useLocalDirectoryStore()
const { state: localState } = storeToRefs(localDirStore)
const { isDark, output, editor, readingTime } = storeToRefs(store)

const {
  editorRefresh,
  exportEditorContent2HTML,
  exportEditorContent2MD,
  formatContent,
  importMarkdownContent,
  resetStyleConfirm,
} = store

const {
  toggleShowInsertFormDialog,
  toggleShowUploadImgDialog,
} = displayStore

const isImgLoading = ref(false)
const timeout = ref<ReturnType<typeof setTimeout> | null>(null)

const preview = ref<HTMLDivElement | null>(null)

// 获取当前文件路径
const currentFilePath = computed(() => {
  const currentPost = store.posts[store.currentPostIndex]
  return 'path' in currentPost ? currentPost.path : null
})

// 获取完整路径显示
const fullPath = computed(() => {
  const basePath = localState.value?.currentDir || ''
  const filePath = currentFilePath.value
  
  if (!basePath) return '未选择目录'
  
  if (filePath) {
    // 修复 Windows 路径显示问题
    if (typeof filePath === 'string') {
      // 如果 filePath 是完整路径，只显示相对路径部分
      if (filePath.startsWith(basePath)) {
        return filePath
      }
      // 否则只取文件名
      const fileName = filePath.split(/[/\\]/).pop()
      return `${basePath}${basePath.endsWith('/') || basePath.endsWith('\\') ? '' : '/'}${fileName}`
    }
  }
  
  // 否则只显示目录路径
  return basePath
})

// 使浏览区与编辑区滚动条建立同步联系
function leftAndRightScroll() {
  const scrollCB = (text: string) => {
    let source: HTMLElement
    let target: HTMLElement

    clearTimeout(timeout.value || undefined)
    if (text === `preview`) {
      source = preview.value!
      target = document.querySelector<HTMLElement>(`.CodeMirror-scroll`)!

      editor.value!.off(`scroll`, editorScrollCB)
      timeout.value = setTimeout(() => {
        editor.value!.on(`scroll`, editorScrollCB)
      }, 300)
    }
    else {
      source = document.querySelector<HTMLElement>(`.CodeMirror-scroll`)!
      target = preview.value!

      target.removeEventListener(`scroll`, previewScrollCB, false)
      timeout.value = setTimeout(() => {
        target.addEventListener(`scroll`, previewScrollCB, false)
      }, 300)
    }

    const percentage
      = source.scrollTop / (source.scrollHeight - source.offsetHeight)
    const height = percentage * (target.scrollHeight - target.offsetHeight)

    target.scrollTo(0, height)
  }

  function editorScrollCB() {
    scrollCB(`editor`)
  }

  function previewScrollCB() {
    scrollCB(`preview`)
  }

  (preview.value!).addEventListener(`scroll`, previewScrollCB, false)
  editor.value!.on(`scroll`, editorScrollCB)
}

onMounted(() => {
  setTimeout(() => {
    leftAndRightScroll()
  }, 300)
})

// 更新编辑器
function onEditorRefresh() {
  editorRefresh()
}

const backLight = ref(false)
const isCoping = ref(false)

function startCopy() {
  isCoping.value = true
  backLight.value = true
}

// 拷贝结束
function endCopy() {
  backLight.value = false
  setTimeout(() => {
    isCoping.value = false
  }, 800)
}

function beforeUpload(file: File) {
  // validate image
  const checkResult = checkImage(file)
  if (!checkResult.ok) {
    toast.error(checkResult.msg!)
    return false
  }

  // check image host
  const imgHost = localStorage.getItem(`imgHost`) || `default`
  localStorage.setItem(`imgHost`, imgHost)

  const config = localStorage.getItem(`${imgHost}Config`)
  const isValidHost = imgHost === `default` || config
  if (!isValidHost) {
    toast.error(`请先配置 ${imgHost} 图床参数`)
    return false
  }
  return true
}

// 图片上传结束
function uploaded(imageUrl: string) {
  if (!imageUrl) {
    toast.error(`上传图片未知异常`)
    return
  }
  toggleShowUploadImgDialog(false)
  // 上传成功，获取光标
  const cursor = editor.value!.getCursor()
  const markdownImage = `![](${imageUrl})`
  // 将 Markdown 形式的 URL 插入编辑框光标所在位置
  toRaw(store.editor!).replaceSelection(`\n${markdownImage}\n`, cursor as any)
  toast.success(`图片上传成功`)
}
function uploadImage(file: File, cb?: { (url: any): void, (arg0: unknown): void } | undefined) {
  isImgLoading.value = true

  toBase64(file)
    .then(base64Content => fileApi.fileUpload(base64Content, file))
    .then((url) => {
      if (cb) {
        cb(url)
      }
      else {
        uploaded(url)
      }
    })
    .catch((err) => {
      toast.error(err.message)
    })
    .finally(() => {
      isImgLoading.value = false
    })
}

const changeTimer = ref<ReturnType<typeof setTimeout> | null>(null)

// 监听暗色模式并更新编辑器
watch(isDark, () => {
  const theme = isDark.value ? `darcula` : `xq-light`
  toRaw(editor.value)?.setOption?.(`theme`, theme)
})

// 初始化编辑器
function initEditor() {
  const editorDom = document.querySelector<HTMLTextAreaElement>(`#editor`)!

  if (!editorDom.value) {
    editorDom.value = store.posts[store.currentPostIndex].content
  }
  editor.value = CodeMirror.fromTextArea(editorDom, {
    mode: 'gfm',  // 使用 GitHub Flavored Markdown 模式
    theme: isDark.value ? `darcula` : `xq-light`,
    lineNumbers: false,
    lineWrapping: true,
    styleActiveLine: true,
    autoCloseBrackets: true,
    // 启用代码提示
    extraKeys: {
      'Ctrl-Space': 'autocomplete',  // 触发代码提示的快捷键
      [`${shiftKey}-${altKey}-F`]: function autoFormat(editor) {
        formatDoc(editor.getValue()).then((doc) => {
          editor.setValue(doc)
        })
      },
      [`${ctrlKey}-B`]: function bold(editor) {
        const selected = editor.getSelection()
        editor.replaceSelection(`**${selected}**`)
      },
      [`${ctrlKey}-I`]: function italic(editor) {
        const selected = editor.getSelection()
        editor.replaceSelection(`*${selected}*`)
      },
      [`${ctrlKey}-D`]: function del(editor) {
        const selected = editor.getSelection()
        editor.replaceSelection(`~~${selected}~~`)
      },
      [`${ctrlKey}-K`]: function italic(editor) {
        const selected = editor.getSelection()
        editor.replaceSelection(`[${selected}]()`)
      },
      [`${ctrlKey}-E`]: function code(editor) {
        const selected = editor.getSelection()
        editor.replaceSelection(`\`${selected}\``)
      },
      // 预备弃用
      [`${ctrlKey}-L`]: function code(editor) {
        const selected = editor.getSelection()
        editor.replaceSelection(`\`${selected}\``)
      },
      // 标题快捷键
      [`${ctrlKey}-1`]: function h1(editor) {
        addFormat('h1')
      },
      [`${ctrlKey}-2`]: function h2(editor) {
        addFormat('h2')
      },
      [`${ctrlKey}-3`]: function h3(editor) {
        addFormat('h3')
      },
      // 列表快捷键
      [`${ctrlKey}-U`]: function ul(editor) {
        addFormat('ul')
      },
      [`${ctrlKey}-O`]: function ol(editor) {
        addFormat('ol')
      },
      [`${ctrlKey}-T`]: function task(editor) {
        addFormat('task')
      },
      // 其他快捷键
      [`${ctrlKey}-Q`]: function quote(editor) {
        addFormat('quote')
      },
      [`${ctrlKey}-${shiftKey}-K`]: function codeblock(editor) {
        addFormat('codeblock')
      },
      [`${ctrlKey}-${shiftKey}-H`]: function hr(editor) {
        addFormat('hr')
      },
      [`${ctrlKey}-${shiftKey}-I`]: function image(editor) {
        addFormat('image')
      },
      // 使用 CodeMirror 原生搜索功能
      [`${ctrlKey}-F`]: 'findPersistent',  // 搜索
      [`${ctrlKey}-G`]: 'findNext',        // 查找下一个
      [`${shiftKey}-${ctrlKey}-G`]: 'findPrev', // 查找上一个
      [`${ctrlKey}-H`]: 'replace',         // 替换
      // 对齐快捷键
      [`${ctrlKey}-[`]: () => addFormat('align-left'),
      [`${ctrlKey}-M`]: () => addFormat('align-center'),
      [`${ctrlKey}-]`]: () => addFormat('align-right'),
      [`${ctrlKey}-J`]: () => addFormat('align-justify'),
    },
    // 配置提示选项
    hintOptions: {
      completeSingle: false,         // 当只有一个选项时不自动补全
      closeOnUnfocus: true,         // 失去焦点时关闭提示
      alignWithWord: true,          // 提示框对齐当前单词
      hint: function(cm: CodeMirror.Editor, options: any) {
        const cursor = cm.getCursor()
        const line = cm.getLine(cursor.line)
        const token = cm.getTokenAt(cursor)
        const currentWord = token.string.toLowerCase()
        
        // 根据当前行开头判断上下文
        const lineStart = line.slice(0, cursor.ch)
        
        // 对齐方式提示
        if (currentWord.startsWith('<')) {
          return {
            list: [
              { 
                text: '<left></left>', 
                displayText: '<left> 左对齐', 
                shortcut: 'Ctrl+[',
                cursorOffset: 6  // 光标位置偏移，放在开始标签后
              },
              { 
                text: '<center></center>', 
                displayText: '<center> 居中对齐', 
                shortcut: 'Ctrl+M',
                cursorOffset: 8
              },
              { 
                text: '<right></right>', 
                displayText: '<right> 右对齐', 
                shortcut: 'Ctrl+]',
                cursorOffset: 7
              },
              { 
                text: '<justify></justify>', 
                displayText: '<justify> 两端对齐', 
                shortcut: 'Ctrl+J',
                cursorOffset: 9
              }
            ],
            from: CodeMirror.Pos(cursor.line, token.start),
            to: CodeMirror.Pos(cursor.line, token.end),
            hint: (cm: any, data: any, item: any) => {
              cm.replaceRange(item.text, data.from, data.to)
              // 将光标移动到标签内部
              if (item.cursorOffset) {
                const cursor = cm.getCursor()
                cm.setCursor({
                  line: cursor.line,
                  ch: data.from.ch + item.cursorOffset
                })
              }
            }
          }
        }
        
        // 代码块语言提示
        if (lineStart.match(/^```\s*$/)) {
          return {
            list: ['javascript', 'typescript', 'html', 'css', 'python', 'java', 'c', 'cpp', 'go', 'rust', 'php', 'sql']
              .filter(lang => lang.startsWith(currentWord))
              .map(lang => ({ text: lang, displayText: `${lang} 代码块` })),
            from: cursor,
            to: cursor
          }
        }
        
        // 表格语法提示
        if (lineStart.match(/^\|.*\|?\s*$/)) {
          return {
            list: ['---|', ':---|', ':---:|', '---:|'].map(text => ({
              text,
              displayText: '表格对齐'
            })),
            from: CodeMirror.Pos(cursor.line, cursor.ch),
            to: CodeMirror.Pos(cursor.line, cursor.ch)
          }
        }

        // Markdown 语法提示
        const markdownHints = [
          { text: '# ', displayText: '# 一级标题', shortcut: 'Ctrl+1' },
          { text: '## ', displayText: '## 二级标题', shortcut: 'Ctrl+2' },
          { text: '### ', displayText: '### 三级标题', shortcut: 'Ctrl+3' },
          { text: '- ', displayText: '- 无序列表项', shortcut: 'Ctrl+U' },
          { text: '1. ', displayText: '1. 有序列表项', shortcut: 'Ctrl+O' },
          { text: '- [ ] ', displayText: '- [ ] 待办事项', shortcut: 'Ctrl+T' },
          { text: '> ', displayText: '> 引用内容', shortcut: 'Ctrl+Q' },
          { text: '```', displayText: '``` 代码块 ```', shortcut: 'Ctrl+K' },
          { text: '**', displayText: '**粗体文本**', shortcut: 'Ctrl+B' },
          { text: '*', displayText: '*斜体文本*', shortcut: 'Ctrl+I' },
          { text: '[链接](url)', displayText: '[链接文本](链接地址)', shortcut: 'Ctrl+K' },
          { text: '![图片](url)', displayText: '![图片描述](图片地址)', shortcut: 'Ctrl+I' },
          { text: '---', displayText: '--- 分隔线', shortcut: 'Ctrl+H' },
          { text: '|列1|列2|', displayText: '|表头1|表头2| 表格', shortcut: 'Ctrl+L' },
          { text: '`', displayText: '`行内代码`', shortcut: 'Ctrl+E' },
          { text: '~~', displayText: '~~删除线文本~~', shortcut: 'Ctrl+D' },
          { text: '> [!NOTE]', displayText: '> [!NOTE] 提示框', shortcut: 'Ctrl+Q' },
          { text: '> [!WARNING]', displayText: '> [!WARNING] 警告框', shortcut: 'Ctrl+Q' },
          { text: '> [!TIP]', displayText: '> [!TIP] 技巧框', shortcut: 'Ctrl+Q' },
          // 表格对齐语法
          { text: '|:---|', displayText: '|:---| 表格左对齐', shortcut: '' },
          { text: '|:---:|', displayText: '|:---:| 表格居中对齐', shortcut: '' },
          { text: '|---:|', displayText: '|---:| 表格右对齐', shortcut: '' },
        ]
        
        // 过滤出匹配当前输入的提示
        const filteredHints = markdownHints.filter(hint => 
          hint.text.toLowerCase().startsWith(currentWord) ||
          hint.displayText.toLowerCase().includes(currentWord)
        )
        
        // 渲染提示项
        function renderHint(elem: HTMLElement, data: any, cur: any) {
          const text = cur.displayText || cur.text
          const shortcut = cur.shortcut || ''
          
          // 分离语法和说明
          const [syntax, description] = text.split(' ')
          
          if (shortcut) {
            elem.innerHTML = `
              <span class="hint-syntax">${syntax}</span>
              <span class="hint-description">${description || ''}</span>
              <span class="hint-shortcut">${shortcut}</span>
            `
          } else {
            elem.innerHTML = `
              <span class="hint-syntax">${syntax}</span>
              <span class="hint-description">${description || ''}</span>
            `
          }
        }

        return {
          list: filteredHints,
          from: CodeMirror.Pos(cursor.line, token.start),
          to: CodeMirror.Pos(cursor.line, token.end),
          renderHint
        }
      }
    },
  })

  editor.value.on(`change`, (e) => {
    clearTimeout(changeTimer.value || undefined)
    changeTimer.value = setTimeout(() => {
      onEditorRefresh()
      store.posts[store.currentPostIndex].content = e.getValue()
    }, 300)
  })

  // 粘贴上传图片并插入
  editor.value.on(`paste`, (_cm, e) => {
    if (!(e.clipboardData && e.clipboardData.items) || isImgLoading.value) {
      return
    }
    for (let i = 0, len = e.clipboardData.items.length; i < len; ++i) {
      const item = e.clipboardData.items[i]
      if (item.kind === `file`) {
        // 校验图床参数
        const pasteFile = item.getAsFile()!
        const isValid = beforeUpload(pasteFile)
        if (!isValid) {
          continue
        }
        uploadImage(pasteFile)
      }
    }
  })

  // 输入时自动触发提示
  editor.value.on('inputRead', (cm, change) => {
    if (change.origin !== 'setValue') {
      cm.showHint({ completeSingle: false })
    }
  })
}

const container = ref(null)

// 工具函数，添加格式
function addFormat(type: string) {
  const editorInstance = editor.value
  if (!editorInstance) return
  
  // 处理搜索和替换
  if (type === 'search') {
    editorInstance.execCommand('findPersistent')
    return
  }
  if (type === 'replace') {
    editorInstance.execCommand('replace')
    return
  }
  
  // 处理标题格式
  if (type.match(/^h[1-6]$/)) {
    const cursor = editorInstance.getCursor()
    const line = editorInstance.getLine(cursor.line)
    const lineStart = { line: cursor.line, ch: 0 }
    
    // 移除现有的标题标记
    const headerMatch = line.match(/^#{1,6}\s/)
    if (headerMatch) {
      editorInstance.replaceRange('', lineStart, { line: cursor.line, ch: headerMatch[0].length })
    }
    
    // 如果不是同级标题，添加新的标题标记
    const headerLevel = parseInt(type.replace('h', ''))
    if (!headerMatch || headerMatch[0].length !== headerLevel + 1) {
      const prefix = '#'.repeat(headerLevel) + ' '
      editorInstance.replaceRange(prefix, lineStart, lineStart)
    }
    return
  }
  
  // 处理列表格式
  if (['ul', 'ol', 'task'].includes(type)) {
    const cursor = editorInstance.getCursor()
    const line = editorInstance.getLine(cursor.line)
    const lineStart = { line: cursor.line, ch: 0 }
    
    // 移除现有的列表标记
    const listMatch = line.match(/^(\d+\.|[-\*]|\[[ x]\])\s/)
    if (listMatch) {
      editorInstance.replaceRange('', lineStart, { line: cursor.line, ch: listMatch[0].length })
    }
    
    // 添加新的列表标记
    const prefixMap = {
      ul: '- ',
      ol: '1. ',
      task: '- [ ] '
    } as const
    
    const prefix = prefixMap[type as keyof typeof prefixMap]
    
    if (prefix) {  // 添加类型检查
      editorInstance.replaceRange(prefix, lineStart, lineStart)
    }
    return
  }
  
  // 处理其他格式
  if (['quote', 'codeblock', 'hr', 'image'].includes(type)) {
    const cursor = editorInstance.getCursor()
    const selection = editorInstance.getSelection()
    
    const formats: Record<string, string> = {
      quote: `> ${selection || '引用内容'}\n`,
      codeblock: `\`\`\`\n${selection || '代码'}\n\`\`\`\n`,
      hr: `\n---\n`,
      image: `![${selection || '图片描述'}](图片链接)\n`
    }
    
    editorInstance.replaceSelection(formats[type])
    return
  }
  
  // 处理对齐方式
  if (type.startsWith('align-')) {
    const cursor = editorInstance.getCursor()
    const line = editorInstance.getLine(cursor.line)
    const lineStart = { line: cursor.line, ch: 0 }
    
    // 移除现有的对齐样式
    const alignMatch = line.match(/^<(left|center|right|justify)>(.*?)<\/\1>$/)
    if (alignMatch) {
      // 提取原文本内容
      const content = alignMatch[2]
      editorInstance.replaceRange(
        content,
        lineStart,
        { line: cursor.line, ch: line.length }
      )
    }
    
    // 添加新的对齐样式
    const alignType = type.replace('align-', '')
    if (!alignMatch || alignMatch[1] !== alignType) {
      const selection = editorInstance.getSelection() || line
      const alignedText = `<${alignType}>${selection}</${alignType}>`
      editorInstance.replaceRange(
        alignedText,
        lineStart,
        { line: cursor.line, ch: line.length }
      )
    }
    return
  }
  
  // 处理其他格式化命令
  (editorInstance as any).options.extraKeys[type](editorInstance)
}

const codeMirrorWrapper = ref<ComponentPublicInstance<HTMLDivElement> | null>(null)

// 转换 markdown 中的本地图片为线上图片
// todo 处理事件覆盖
function mdLocalToRemote() {
  const dom = codeMirrorWrapper.value!

  // 上传 md 中的图片
  const uploadMdImg = async ({ md, list }: { md: { str: string, path: string, file: File }, list: { path: string, file: File }[] }) => {
    const mdImgList = [
      ...(md.str.matchAll(/!\[(.*?)\]\((.*?)\)/g) || []),
    ].filter((item) => {
      return item // 获取所有相对地址的图片
    })
    const root = md.path.match(/.+?\//)![0]
    const resList = await Promise.all<{ matchStr: string, url: string }>(
      mdImgList.map((item) => {
        return new Promise((resolve) => {
          let [, , matchStr] = item
          matchStr = matchStr.replace(/^.\//, ``) // 处理 ./img/ 为 img/ 统一相对路径风格
          const { file }
            = list.find(f => f.path === `${root}${matchStr}`) || {}
          uploadImage(file!, (url) => {
            resolve({ matchStr, url })
          })
        })
      }),
    )
    resList.forEach((item) => {
      md.str = md.str
        .replace(`](./${item.matchStr})`, `](${item.url})`)
        .replace(`](${item.matchStr})`, `](${item.url})`)
    })
    editor.value!.setValue(md.str)
  }

  dom.ondragover = evt => evt.preventDefault()
  dom.ondrop = async (evt: any) => {
    evt.preventDefault()
    for (const item of evt.dataTransfer.items) {
      item.getAsFileSystemHandle().then(async (handle: { kind: string, getFile: () => any }) => {
        if (handle.kind === `directory`) {
          const list = await showFileStructure(handle) as { path: string, file: File }[]
          const md = await getMd({ list })
          uploadMdImg({ md, list })
        }
        else {
          const file = await handle.getFile()
          console.log(`file`, file)
        }
      })
    }
  }

  // 从文件列表中查找一个 md 文件并解析
  async function getMd({ list }: { list: { path: string, file: File }[] }) {
    return new Promise<{ str: string, file: File, path: string }>((resolve) => {
      const { path, file } = list.find(item => item.path.match(/\.md$/))!
      const reader = new FileReader()
      reader.readAsText(file!, `UTF-8`)
      reader.onload = (evt) => {
        resolve({
          str: evt.target!.result as string,
          file,
          path,
        })
      }
    })
  }

  // 转换文件系统句柄中的文件为文件列表
  async function showFileStructure(root: any) {
    const result = []
    let cwd = ``
    try {
      const dirs = [root]
      for (const dir of dirs) {
        cwd += `${dir.name}/`
        for await (const [, handle] of dir) {
          if (handle.kind === `file`) {
            result.push({
              path: cwd + handle.name,
              file: await handle.getFile(),
            })
          }
          else {
            result.push({
              path: `${cwd + handle.name}/`,
            })
            dirs.push(handle)
          }
        }
      }
    }
    catch (err) {
      console.error(err)
    }
    return result
  }
}

onMounted(() => {
  initEditor()
  onEditorRefresh()
  mdLocalToRemote()
})

// 阅览模式状态
const isFullWidthPreview = ref(false)
</script>

<template>
  <div ref="container" class="container flex flex-col">
    <EditorHeader
      @add-format="addFormat"
      @format-content="formatContent"
      @start-copy="startCopy"
      @end-copy="endCopy"
    />
    <main class="container-main flex flex-1 flex-col">
      <div class="container-main-section border-radius-10 relative flex flex-1 overflow-hidden border-1">
        <PostSlider />
        <div
          ref="codeMirrorWrapper"
          class="codeMirror-wrapper flex-1"
          :class="{
            'order-1 border-l': !store.isEditOnLeft,
            'border-r': store.isEditOnLeft,
          }"
        >
          <ContextMenu>
            <ContextMenuTrigger>
              <textarea
                id="editor"
                type="textarea"
                placeholder="Your markdown text here."
              />
            </ContextMenuTrigger>
            <ContextMenuContent class="w-64">
              <ContextMenuItem inset @click="toggleShowUploadImgDialog()">
                上传图片
              </ContextMenuItem>
              <ContextMenuItem inset @click="toggleShowInsertFormDialog()">
                插入表格
              </ContextMenuItem>
              <ContextMenuItem inset @click="resetStyleConfirm()">
                恢复默认样式
              </ContextMenuItem>
              <ContextMenuSeparator />
              <ContextMenuItem inset @click="importMarkdownContent()">
                导入 .md 文档
              </ContextMenuItem>
              <ContextMenuItem inset @click="exportEditorContent2MD()">
                导出 .md 文档
              </ContextMenuItem>
              <ContextMenuItem inset @click="exportEditorContent2HTML()">
                导出 .html
              </ContextMenuItem>
              <ContextMenuItem inset @click="formatContent()">
                格式化
                <ContextMenuShortcut>{{ altSign }} + {{ shiftSign }} + F</ContextMenuShortcut>
              </ContextMenuItem>
            </ContextMenuContent>
          </ContextMenu>
        </div>
        <div
          id="preview"
          ref="preview"
          class="preview-wrapper flex-1 p-5"
        >
          <div class="relative w-full h-full">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    class="absolute right-2 top-2 z-10"
                    @click="isFullWidthPreview = !isFullWidthPreview"
                  >
                    <Smartphone v-if="!isFullWidthPreview" class="h-4 w-4" />
                    <Monitor v-else class="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{{ isFullWidthPreview ? '切换到移动端预览' : '切换到大屏预览' }}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <div id="output-wrapper" :class="{ output_night: !backLight }">
              <div 
                class="preview border-x-1 shadow-xl transition-all duration-200"
                :style="{ 
                  width: isFullWidthPreview ? '100%' : '375px',
                  margin: '0 auto'
                }"
              >
                <section id="output" v-html="output" />
                <div v-if="isCoping" class="loading-mask">
                  <div class="loading-mask-box">
                    <div class="loading__img" />
                    <span>正在生成</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <BackTop target="preview" :right="40" :bottom="40" />
        </div>
        <CssEditor class="order-2 flex-1" />
        <RightSlider class="order-2" />
      </div>
      <footer class="h-[30px] flex select-none items-center justify-between px-4 text-[12px]">
        <div class="text-gray-500 dark:text-gray-400 truncate flex-1 min-w-0 pr-4">
          {{ fullPath }}
        </div>
        <div class="flex-shrink-0">
          字数 {{ readingTime?.words }}， 阅读大约需 {{ Math.ceil(readingTime?.minutes ?? 0) }} 分钟
        </div>
      </footer>

      <UploadImgDialog @upload-image="uploadImage" />

      <InsertFormDialog />

      <RunLoading />

      <AlertDialog v-model:open="store.isOpenConfirmDialog">
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>提示</AlertDialogTitle>
            <AlertDialogDescription>
              此操作将丢失本地自定义样式，是否继续？
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction @click="store.resetStyle()">
              确认
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  </div>
</template>

<style lang="less" scoped>
@import url('../assets/less/app.less');
</style>

<style lang="less" scoped>
.container {
  height: 100vh;
  min-width: 100%;
  padding: 0;
}

.container-main {
  overflow: hidden;
}

#output-wrapper {
  position: relative;
  user-select: text;
  height: 100%;
}

.loading-mask {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  text-align: center;
  color: hsl(var(--foreground));
  background-color: hsl(var(--background));

  .loading-mask-box {
    position: sticky;
    top: 50%;
    transform: translateY(-50%);

    .loading__img {
      width: 75px;
      height: 75px;
      background: url('../assets/images/favicon.png') no-repeat;
      margin: 1em auto;
      background-size: cover;
    }
  }
}

:deep(.preview-table) {
  border-spacing: 0;
}

.codeMirror-wrapper,
.preview-wrapper {
  height: 100%;
}

.codeMirror-wrapper {
  overflow-x: auto;
}

.preview {
  position: relative;
  margin: 0 auto;  // 居中显示
  min-height: 100%;
  padding: 20px;
  font-size: 14px;
  box-sizing: border-box;
  outline: none;
  word-wrap: break-word;
}
</style>
