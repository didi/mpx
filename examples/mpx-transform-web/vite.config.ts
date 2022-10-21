import mpx from '@mpxjs/web-plugin/vite'
import path from 'path'
import { defineConfig, splitVendorChunkPlugin } from 'vite'
import legacy from '@vitejs/plugin-legacy'

export default defineConfig({
  plugins: [
    mpx({
      env: 'didi',
      mode: 'web',
      externalClasses: ['list-class'],
      // 定义一些全局环境变量，可在JS/模板/样式/JSON中使用
      defs: {
        // eslint-disable-next-line camelcase
        __application_name__: 'dd'
      },

      // 是否转换px到rpx
      transRpxRules: [
        {
          mode: 'only',
          comment: 'use rpx',
          include: path.join(__dirname, '..', 'src')
        }
      ],
      i18n: {
        locale: 'en-US',
        // messages既可以通过对象字面量传入，也可以通过messagesPath指定一个js模块路径，在该模块中定义配置并导出，dateTimeFormats/dateTimeFormatsPath和numberFormats/numberFormatsPath同理
        messagesPath: path.resolve('./src/i18n/index.js')
      }
    }),
    // test with split chunk
    splitVendorChunkPlugin()
    // test with legency
    // legacy()
  ],
  resolve: {
    preserveSymlinks: true, // for dev linked packages
    alias: {
      '@': path.resolve('.')
    },
    extensions: ['.mpx', '.mjs', '.js', '.ts', '.jsx', '.tsx', '.json']
  },
  build: {
    target: ['es2015'],
    sourcemap: !(process.env.NODE_ENV === 'production'),
    minify: false,
    rollupOptions: {
      output: {
        manualChunks (id) {
          if (id.includes('vueComponentNormalizer')) {
            return 'vendor'
          }
        }
      }
    }
  },
  optimizeDeps: {
    include: ['lodash/throttle']
  },
  css: {
    devSourcemap: !(process.env.NODE_ENV === 'production')
  }
})
