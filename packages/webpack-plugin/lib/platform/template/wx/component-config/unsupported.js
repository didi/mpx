// 支付宝小程序不支持的标签集合
const TAG_NAME_ARR = ['live-pusher', 'live-player', 'camera', 'video', 'audio', 'functional-page-navigator']

/**
 * @param {function(object): function} print
 * @return {{test: RegExp, ali(*=): void}}
 */
module.exports = function ({ print }) {
  const aliUnsupportedTagError = print({ platform: 'ali', isError: true, type: 'tag' })

  const exp = new RegExp('^(' + TAG_NAME_ARR.join('|') + ')$')

  return {
    // 匹配标签名，可传递正则
    test: exp,
    ali: aliUnsupportedTagError
  }
}
