import mpx from '@mpxjs/web-plugin/vite'
import path from 'path'
import { defineConfig, splitVendorChunkPlugin } from 'vite'
import inject from '@rollup/plugin-inject'
// import legacy from '@vitejs/plugin-legacy'
function resolve (dir) {
  return path.join(__dirname, '.', dir)
}

const resolveSdk = (module) => resolve(`node_modules/@didi/driver-biz-sdk/src/${module}/index.js`)

export default defineConfig({
  optimizeDeps: {
    include: ['qs'],
    exclude: ['@didi/driver-biz-sdk', '@didi/driver-biz-mp-sdk']
  },
  define: {

  },
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
        // messagesPath: path.resolve('./src/i18n/index.js'),
        messages: {
          'en-US': {
            message: {
              title: 'test',
              hello: '{msg} world'
            }
          },
          'zh-CN': {
            message: {
              title: '中文',
              hello: '{msg} 世界'
            }
          }
        }
      }
    }),
    // test with split chunk
    splitVendorChunkPlugin(),
    inject({
      $Ajax: [resolveSdk('ajax'), 'default'],
      $Omega: [resolveSdk('omega'), 'default'],
      $Bridge: [resolveSdk('bridge'), 'default'],
      $Login: [resolveSdk('login'), 'default']
    })
    // test with legency
    // legacy()
  ],
  resolve: {
    alias: {
      '@': path.resolve('.'),
      '@didi/mpx': '@mpxjs/core',
      '@didi/enhance-url-loader': '@mpxjs/url-loader',
      src: resolve('src'),
      components: resolve('src/components'),
      pages: resolve('src/pages'),
      common: resolve('src/common'),
      api: resolve('src/api'),
      store: resolve('src/store')
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
  css: {
    devSourcemap: !(process.env.NODE_ENV === 'production')
  }
})
