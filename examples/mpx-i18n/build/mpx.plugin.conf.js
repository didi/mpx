const path = require('path')
const enUSLang = require('../i18n/en-US')
const zhCNLang = require('../i18n/zh-CN')
const dateTimeFormats = require('../i18n/dateTimeFormats')

// 可以在此配置mpx webpack plugin，会assign进build.js里new创建plugin的config里
module.exports = {
  // resolve的模式
  resolveMode: 'webpack', // 可选值 webpack / native，默认是webpack，原生迁移建议使用native

  // 当resolveMode为native时可通过该字段指定项目根目录
  // projectRoot: path.resolve(__dirname, '../src'),

  // 可选值 full / changed，不传默认为change，当设置为changed时在watch模式下将只会对内容发生变化的文件进行写入，以提升小程序开发者工具编译性能
  writeMode: 'changed',

  // 支付宝小程序没有微信小程序类似的组件样式隔离机制，如果遇到样式问题，将本选项置为true将自动为支付宝添加scope，会带来略微的体积上涨
  enableAutoScope: false,

  // 批量指定文件mode，和webpack的rules相同
  modeRules: {},

  // 给模板和json中定义一些全局环境变量
  defs: {},

  i18n: {
    // 可配置项包括 locale / message / dateTimeFormats / numberFormats
    // 默认语言
    locale: 'en-US',
    //
    // 时间本地化格式
    dateTimeFormats: dateTimeFormats,
    //
    // messages既可以通过对象字面量传入，也可以通过messagesPath指定一个js模块路径，在该模块中定义配置并导出，dateTimeFormats/dateTimeFormatsPath和numberFormats/numberFormatsPath同理
    //
    // ***********
    // 内联使用    内联/外部仅可使用其中一种
    // ***********
    messages: {
      'en-US': {
        ...enUSLang,
        // 内联直接写在mpx.plugin.conf.js中
        message: {
          hello: '{msg} world'
        }
      },
      // 整个作为文件单独引入配置
      'zh-CN': zhCNLang
    }
    //
    // ***********
    // 外部文件    内联/外部仅可使用其中一种
    // ***********
    // messagesPath: path.resolve(__dirname, '../i18n/index.js')
  }
}
