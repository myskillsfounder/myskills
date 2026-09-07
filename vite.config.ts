import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import path from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tanstackRouter({
      target: 'react',
      autoCodeSplitting: true,
      routesDirectory: './src/routes',
      generatedRouteTree: './src/routeTree.gen.ts',
    }),
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
  },
  build: {
    rollupOptions: {
      output: {
        // Without this, Rollup's automatic chunking is sensitive to
        // incidental changes elsewhere in the import graph — a recent
        // refactor caused it to fold lucide-react's entire icon set (which
        // used to be its own ~212KB chunk) into the main entry bundle,
        // pushing it to ~570KB uncompressed. These are large, stable
        // dependencies that change far less often than app code, so
        // pinning them to their own chunks keeps them cacheable across
        // deploys instead of re-downloaded whenever any app code changes.
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined
          if (id.includes('lucide-react')) return 'vendor-icons'
          if (id.includes('/react-dom/') || id.includes('/react/') || id.includes('/scheduler/')) {
            return 'vendor-react'
          }
          if (id.includes('@supabase')) return 'vendor-supabase'
          if (id.includes('@tanstack')) return 'vendor-tanstack'
          return 'vendor'
        },
      },
    },
  },
})
