/*
 * Configures Vite to build the Vue landing page, serve the shared HTML pages,
 * and forward local API requests to the Java backend.
 */

import { fileURLToPath, URL } from 'node:url'

import { defineConfig, loadEnv } from 'vite'
import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
// Publish the shared HTML pages alongside the Vue landing page without duplicating sources.
function sharedPages(apiBase) {
  const directory = fileURLToPath(new URL('../fairshare_site/', import.meta.url))
  // Escape the backend URL before inserting it into an HTML attribute.
  const escapedBase = apiBase.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;')
  const contentTypes = { '.html': 'text/html', '.css': 'text/css', '.mjs': 'text/javascript' }
  const readPage = async (name) => {
    const source = await readFile(path.join(directory, name), 'utf8')
    return name.endsWith('.html') ? source.replace(
      '<meta name="fairshare-api-base" content="" />',
      `<meta name="fairshare-api-base" content="${escapedBase}" />`,
    ) : source
  }
  return {
    name: 'fairshare-shared-pages',
    configureServer(server) {
      // Serve shared pages from their source folder during local development.
      server.middlewares.use(async (request, response, next) => {
        const name = new URL(request.url, 'http://localhost').pathname.slice(1)
        // Leave index.html to Vite so it can load the Vue landing page.
        if (name === 'index.html' || name.includes('/') || !contentTypes[path.extname(name)]) return next()
        try {
          const source = await readPage(name)
          response.setHeader('Content-Type', `${contentTypes[path.extname(name)]}; charset=utf-8`)
          response.end(source)
        } catch { next() }
      })
    },
    async generateBundle() {
      // Include the same pages and assets in the production build.
      for (const name of await readdir(directory)) {
        if (name !== 'index.html' && contentTypes[path.extname(name)]) {
          this.emitFile({ type: 'asset', fileName: name, source: await readPage(name) })
        }
      }
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, fileURLToPath(new URL('.', import.meta.url)), 'VITE_')
  return {
    plugins: [
      sharedPages(env.VITE_API_BASE_URL || ''),
      vue(),
      vueDevTools(),
    ],
    server: {
      // Forward local API requests to Spring Boot when the page uses a relative URL.
      proxy: { '/api': 'http://localhost:8080' },
    },
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
  }
})
