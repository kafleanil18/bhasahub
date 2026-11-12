import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'

// Change the worker whenever the application build changes.
function pwaWorker() {
  return {
    name: 'pwa-worker',
    apply: 'build',
    generateBundle(_options, bundle) {
      const hash = createHash('sha256')
      for (const [name, file] of Object.entries(bundle).sort()) {
        hash.update(name).update(file.type === 'chunk' ? file.code : file.source)
      }
      hash.update(readFileSync(new URL('./public/offline.html', import.meta.url)))
      hash.update(readFileSync(new URL('./public/manifest.webmanifest', import.meta.url)))
      const source = readFileSync(new URL('./src/pwa/worker.js', import.meta.url), 'utf8')
      this.emitFile({ type: 'asset', fileName: 'sw.js', source: source.replace('__BUILD_ID__', hash.digest('hex').slice(0, 16)) })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), pwaWorker()],
})
