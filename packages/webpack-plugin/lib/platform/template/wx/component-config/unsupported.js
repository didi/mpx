// 支付宝小程序不支持的标签集合
const ALI_UNSUPPORTED_AG_NAME_ARR = ['live-pusher', 'live-player', 'camera', 'video', 'audio', 'functional-page-navigator']
// 百度小程序不支持的标签集合
const BAIDU_UNSUPPORTED_AG_NAME_ARR = ['functional-page-navigator']

/**
 * @param {function(object): function} print
 * @return {{test: RegExp, ali(*=): void}}
 */
module.exports = function ({ print }) {
  const aliUnsupportedTagError = print({ platform: 'ali', isError: true, type: 'tag' })
  const baiduUnsupportedTagError = print({ platform: 'baidu', isError: true, type: 'tag' })

  const aliUnsupportedExp = new RegExp('^(' + ALI_UNSUPPORTED_AG_NAME_ARR.join('|') + ')$')
  const baiduUnsupportedExp = new RegExp('^(' + BAIDU_UNSUPPORTED_AG_NAME_ARR.join('|') + ')$')

  return [
    {
      supportedTargets: ['swan'],
      test: baiduUnsupportedExp,
      swan: baiduUnsupportedTagError
    },
    {
      // 匹配标签名，可传递正则
      supportedTargets: ['ali'],
      test: aliUnsupportedExp,
      ali: aliUnsupportedTagError
    }
  ]
}