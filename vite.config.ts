import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  if (mode === 'library') {
    return {
      plugins: [react()],
      build: {
        lib: {
          entry: resolve(__dirname, 'src/index.ts'),
          name: 'Dado',
          fileName: 'dado',
        },
        rollupOptions: {
          external: ['react', 'react-dom'],
          output: {
            exports: 'named',
            globals: {
              react: 'React',
              'react-dom': 'ReactDOM',
            },
          },
        },
      },
    }
  }
  
  // Default development configuration
  return {
    plugins: [react()],
    base: process.env.NODE_ENV === 'production' ? '/dado/' : '/',
  }
})
