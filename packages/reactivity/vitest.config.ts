import { defineConfig } from 'vitest/config'

export default defineConfig({
  define: {
    __mpx_mode__: JSON.stringify('test')
  }
})
