import { readdir, rename } from 'node:fs/promises'
import { join } from 'node:path'

async function renameFiles(dir) {
  const files = await readdir(dir)
  
  for (const file of files) {
    if (file.endsWith('.js')) {
      const oldPath = join(dir, file)
      const newPath = join(dir, file.replace('.js', '.cjs'))
      await rename(oldPath, newPath)
    }
  }
}

// 重命名 electron/dist 目录下的所有 .js 文件为 .cjs
await renameFiles('electron/dist') 