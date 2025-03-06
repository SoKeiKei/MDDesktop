import path from 'node:path'
import vue from '@vitejs/plugin-vue'
import { visualizer } from 'rollup-plugin-visualizer'
import UnoCSS from 'unocss/vite'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { defineConfig } from 'vite'
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import { fileURLToPath } from 'url'

// https://vitejs.dev/config/
export default defineConfig({
  base: './',
  plugins: [
    vue(),
    UnoCSS(),
    nodePolyfills({
      include: [
        'path',
        'util',
        'timers',
        'stream',
        'fs',
        'crypto',
        'buffer',
        'http',
        'https'
      ],
    }),
    process.env.ANALYZE === `true` && visualizer({
      emitFile: true,
      filename: `stats.html`,
    }),
    AutoImport({
      imports: [
        'vue',
        'pinia',
        '@vueuse/core'
      ],
      dts: 'auto-imports.d.ts'
    }),
    Components({
      resolvers: [],
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  css: {
    devSourcemap: true,
  },
  build: {
    outDir: 'dist',
    assetsDir: 'static',
    emptyOutDir: true,
    target: 'esnext',
    minify: 'esbuild',
    sourcemap: false,
    chunkSizeWarningLimit: 2000,
    commonjsOptions: {
      include: [/node_modules/],
      transformMixedEsModules: true
    },
    esbuildOptions: {
      drop: ['console', 'debugger'],
    },
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': [
            'vue',
            'pinia',
            '@vueuse/core',
            'buffer-from',
            'crypto-js'
          ],
          'editor': [
            'codemirror',
            'marked',
            'highlight.js'
          ],
          'chart': ['mermaid'],
          'ui': [
            'radix-vue',
            'lucide-vue-next',
            'class-variance-authority',
            'clsx',
            'tailwind-merge'
          ]
        }
      }
    },
  },
  optimizeDeps: {
    include: [
      'vue',
      'pinia',
      'codemirror',
      'marked',
      'mermaid',
      'buffer-from',
      'crypto-js'
    ],
    exclude: [
      'electron'
    ]
  },
})
