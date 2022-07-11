module.exports = {
  'zh-CN': {
    message: {
      hello: '{msg} 世界'
    },
    welcome: {
      intro: '这是mpx框架提供的i18n能力演示用的小程序'
    }
  },
  'en-US': {
    message: {
      hello: '{msg} world'
    },
    welcome: {
      intro: 'this is an example of using i18n with mpx framework'
    }
  }
}
/* 不再支持下面这种方式：需要处理为上面的方式
var zhCNLang = require('./zh-CN')
var enUSLang = require('./en-US')
module.exports = {
  'zh-CN': zhCNLang,
  'en-US': enUSLang
}
*/
