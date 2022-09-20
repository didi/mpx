const path = require('path')
const mpx = require('@mpxjs/web-plugin/vite')
const { defineConfig } = require('vite')

module.exports = defineConfig({

  plugins: [
    mpx({
      env: 'didi',
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
        locale: 'zh-CN',
        // messages既可以通过对象字面量传入，也可以通过messagesPath指定一个js模块路径，在该模块中定义配置并导出，dateTimeFormats/dateTimeFormatsPath和numberFormats/numberFormatsPath同理
        messagesPath: path.resolve('./src/i18n/index.js')
      }
    })
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
    sourcemap: true,
    minify: false
  },
  optimizeDeps: {
    include: ['lodash/throttle']
  },
  css: {
    devSourcemap: true
  }
})
