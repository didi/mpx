const resolve = require('../build/utils').resolve
const path = require('path')

// 可以在此配置mpx webpack plugin
// 配置项文档： https://www.mpxjs.cn/api/compile.html#mpxwebpackplugin-options
module.exports = {
  // resolve的模式
  resolveMode: 'webpack', // 可选值 webpack / native，默认是webpack，原生迁移建议使用native

  // 当resolveMode为native时可通过该字段指定项目根目录
  // projectRoot: resolve('src'),

  // 可选值 full / changed，不传默认为change，当设置为changed时在watch模式下将只会对内容发生变化的文件进行写入，以提升小程序开发者工具编译性能
  writeMode: 'changed',

  env: 'someEnv',

  // 是否需要对样式加scope，因为只有ali平台没有样式隔离，只对ali平台生效，提供include和exclude，和webpack的rules规则相同
  // autoScopeRules: {
  //   include: [resolve('src')]
  // },

  // 批量指定文件mode，用法如下，指定平台，提供include/exclude指定文件，即include的文件会默认被认为是该平台的，include/exclude的规则和webpack的rules的相同
  modeRules: {
    // ali: {
    //   include: [resolve('node_modules/vant-aliapp')]
    // }
  },

  // 定义一些全局环境变量，可在JS/模板/样式/JSON中使用
  defs: {
    __black__: 'blackgan test'
  },

  // 是否转换px到rpx
  transRpxRules: [
    {
      mode: 'all',
      comment: 'use rpx',
      designWidth: 1280,
      include: resolve('src')
    }
  ],

  decodeHTMLText: true,

  transMpxRules: {
    include: () => true,
    exclude: ['@mpxjs']
  },

  autoScopeRules: {
    include: [resolve('src')]
  },

  generateBuildMap: true,

  // 输出web时，vue-loader版本<15时需要将该配置关闭
  forceDisableBuiltInLoader: true,

  subpackageModulesRules: {
    include: [/utils\/common/]
  },

  // 多语言i18n能力 以下是简单示例，更多详情请参考文档：https://didi.github.io/mpx/i18n.html
  i18n: {
    locale: 'en-US',
    // messages既可以通过对象字面量传入，也可以通过messagesPath指定一个js模块路径，在该模块中定义配置并导出，dateTimeFormats/dateTimeFormatsPath和numberFormats/numberFormatsPath同理
    messages: {
      'en-US': {
        message: {
          hello: '{msg} world'
        }
      },
      'zh-CN': {
        message: {
          hello: '{msg} 世界'
        }
      }
    }
  },
  customOutputPath: (type, name, hash, ext, resourcePath) => {
    // type: 资源类型(page | component | static)
    // name: 资源原有文件名
    // hash: 8位长度的hash串
    // ext: 文件后缀(.js｜ .wxml | .json 等)
    // resourcePath: 资源路径
    if (name === 'customOutputCom') {
      return path.join(type + 's', name, 'index' + ext)
    }
    // 输出示例： pages/testax34dde3/index.js
    return path.join(type + 's', name + hash, 'index' + ext)
  }

}
