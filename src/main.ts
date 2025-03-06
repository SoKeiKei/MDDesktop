import { createPinia } from 'pinia'
import { createApp } from 'vue'
import App from './App.vue'

import 'virtual:uno.css'
import 'codemirror/lib/codemirror.css'
import 'codemirror/theme/xq-light.css'
import 'codemirror/theme/darcula.css'

/* 每个页面公共css */
import '@/assets/index.css'
import '@/assets/less/theme.less'

import 'codemirror/mode/css/css'
import 'codemirror/mode/javascript/javascript'
import 'codemirror/mode/markdown/markdown'
import 'codemirror/addon/edit/closebrackets'
import 'codemirror/addon/edit/matchbrackets'
import 'codemirror/addon/selection/active-line'
import 'codemirror/addon/hint/show-hint'
import 'codemirror/addon/hint/css-hint'

// 搜索替换相关依赖
import 'codemirror/addon/search/search'
import 'codemirror/addon/search/searchcursor'
import 'codemirror/addon/dialog/dialog'
import 'codemirror/addon/dialog/dialog.css'

// 代码提示相关
import 'codemirror/addon/hint/show-hint.css'
import 'codemirror/addon/hint/javascript-hint'
import 'codemirror/addon/hint/xml-hint'
import 'codemirror/addon/hint/html-hint'

// 语法高亮相关
import 'codemirror/mode/xml/xml'
import 'codemirror/mode/javascript/javascript'
import 'codemirror/mode/css/css'
import 'codemirror/mode/htmlmixed/htmlmixed'
import 'codemirror/mode/gfm/gfm'  // GitHub Flavored Markdown

const app = createApp(App)

app.use(createPinia())

app.mount(`#app`)
