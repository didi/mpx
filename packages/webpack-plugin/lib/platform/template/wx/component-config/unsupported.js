// 支付宝小程序不支持的标签集合
const ALI_UNSUPPORTED_AG_NAME_ARR = ['live-pusher', 'live-player', 'camera', 'video', 'audio', 'functional-page-navigator']
// 百度小程序不支持的标签集合
const BAIDU_UNSUPPORTED_AG_NAME_ARR = ['functional-page-navigator', 'live-pusher']
// QQ小程序不支持的标签集合
const QQ_UNSUPPORTED_AG_NAME_ARR = ['functional-page-navigator', 'live-player', 'live-pusher', 'map', 'official-account']
// 头条小程序不支持的标签集合
const TOUTIAO_UNSUPPORTED_AG_NAME_ARR = ['movable-view', 'cover-image', 'cover-view', 'movable-area']

/**
 * @param {function(object): function} print
 * @return {array}
 */
module.exports = function ({ print }) {
  const aliUnsupportedTagError = print({ platform: 'ali', isError: true, type: 'tag' })
  const baiduUnsupportedTagError = print({ platform: 'baidu', isError: true, type: 'tag' })
  const qqUnsupportedTagError = print({ platform: 'qq', isError: true, type: 'tag' })
  const ttUnsupportedTagError = print({ platform: 'toutiao', isError: true, type: 'tag' })

  const aliUnsupportedExp = new RegExp('^(' + ALI_UNSUPPORTED_AG_NAME_ARR.join('|') + ')$')
  const baiduUnsupportedExp = new RegExp('^(' + BAIDU_UNSUPPORTED_AG_NAME_ARR.join('|') + ')$')
  const qqUnsupportedExp = new RegExp('^(' + QQ_UNSUPPORTED_AG_NAME_ARR.join('|') + ')$')
  const ttUnsupportedExp = new RegExp('^(' + TOUTIAO_UNSUPPORTED_AG_NAME_ARR.join('|') + ')$')

  return [
    {
      supportedTargets: ['swan'],
      test: baiduUnsupportedExp,
      swan: baiduUnsupportedTagError
    },
    {
      supportedTargets: ['ali'],
      test: aliUnsupportedExp,
      ali: aliUnsupportedTagError
    },
    {
      supportedTargets: ['qq'],
      test: qqUnsupportedExp,
      ali: qqUnsupportedTagError
    },
    {
      supportedTargets: ['tt'],
      test: ttUnsupportedExp,
      ali: ttUnsupportedTagError
    }
  ]
}
