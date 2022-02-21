const path = require('path')
const { defineConfig } = require('vite')

module.exports = defineConfig({
  resolve: {
    alias: {
      'design-docs': path.resolve(__dirname, './src'),
    }
  },
  build: {
    sourcemap: true,
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      name: 'DesignSystem',
      fileName: (format) => `index.${format}.js`
    },
    rollupOptions: {
      external: ['react', 'react-router-dom'],
      output: {
        globals: {
          'react': 'React',
          'react-router-dom': 'ReactRouterDom'
        }
      }
    }
  },
})