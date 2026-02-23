import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { mkdirSync, copyFileSync, readdirSync } from 'fs'
import type { Plugin } from 'vite'

// Copies resources/proxy_addon.py and agent prompt .txt files into out/ after each build.
function copyStaticAssetsPlugin(): Plugin {
  return {
    name: 'copy-static-assets',
    closeBundle() {
      try {
        // proxy addon
        mkdirSync('out/resources', { recursive: true })
        copyFileSync('resources/proxy_addon.py', 'out/resources/proxy_addon.py')
      } catch {
        // not fatal
      }
      try {
        // agent prompt txt files
        const src = 'src/main/agent/prompts'
        const dest = 'out/main/agent/prompts'
        mkdirSync(dest, { recursive: true })
        for (const file of readdirSync(src)) {
          if (file.endsWith('.txt')) {
            copyFileSync(`${src}/${file}`, `${dest}/${file}`)
          }
        }
      } catch {
        // not fatal
      }
    }
  }
}

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin(), copyStaticAssetsPlugin()],
    resolve: {
      alias: {
        '@shared': resolve('src/shared'),
        '@main': resolve('src/main')
      }
    }
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    resolve: {
      alias: {
        '@shared': resolve('src/shared')
      }
    }
  },
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src'),
        '@shared': resolve('src/shared')
      }
    },
    plugins: [react()]
  }
})
