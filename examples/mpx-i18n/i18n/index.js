module.exports = {
  'zh-CN': {
    message: {
      hello: '{msg} 世界'
    },
    welcome: {
      intro: '这是mpx框架提供的i18n能力演示用的小程序'
    },
    // ↓↓↓ i18n key 含 "+" 翻译失效问题复现用 ↓↓↓
    // 正常 key（对照组）：值与 key 不同，能正确翻译
    plainReviews: '评价（正常 key 对照组）',
    // 问题 key（含 "+"）：值与 key 不同，期望显示下面这句翻译，实际会原样返回 key "1000+ reviews"
    '1000+ reviews': '超过 1000 条评价'
    // ↑↑↑ 复现用 ↑↑↑
  },
  'en-US': {
    message: {
      hello: '{msg} world'
    },
    welcome: {
      intro: 'this is an example of using i18n with mpx framework'
    },
    // ↓↓↓ 复现用 ↓↓↓
    plainReviews: 'reviews (normal key)',
    '1000+ reviews': 'over 1000 reviews'
    // ↑↑↑ 复现用 ↑↑↑
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
