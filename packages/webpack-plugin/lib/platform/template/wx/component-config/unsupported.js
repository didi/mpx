// 支付宝小程序不支持的标签集合
const ALI_UNSUPPORTED_TAG_NAME_ARR = ['live-pusher', 'live-player', 'video', 'audio', 'functional-page-navigator', 'editor']
// 百度小程序不支持的标签集合
const BAIDU_UNSUPPORTED_TAG_NAME_ARR = ['functional-page-navigator', 'live-pusher', 'editor']
// QQ小程序不支持的标签集合
const QQ_UNSUPPORTED_TAG_NAME_ARR = ['functional-page-navigator', 'live-player', 'live-pusher', 'map', 'official-account', 'editor']
// 头条小程序不支持的标签集合
const TT_UNSUPPORTED_TAG_NAME_ARR = ['movable-view', 'cover-image', 'cover-view', 'movable-area', 'open-data', 'official-account', 'ad', 'editor', 'functional-page-navigator', 'audio', 'camera', 'live-player', 'live-pusher', 'wxs']

/**
 * @param {function(object): function} print
 * @return {array}
 */
module.exports = function ({ print }) {
  const aliUnsupportedTagError = print({ platform: 'ali', isError: true, type: 'tag' })
  const baiduUnsupportedTagError = print({ platform: 'baidu', isError: true, type: 'tag' })
  const qqUnsupportedTagError = print({ platform: 'qq', isError: true, type: 'tag' })
  const ttUnsupportedTagError = print({ platform: 'bytedance', isError: true, type: 'tag' })

  const aliUnsupportedExp = new RegExp('^(' + ALI_UNSUPPORTED_TAG_NAME_ARR.join('|') + ')$')
  const baiduUnsupportedExp = new RegExp('^(' + BAIDU_UNSUPPORTED_TAG_NAME_ARR.join('|') + ')$')
  const qqUnsupportedExp = new RegExp('^(' + QQ_UNSUPPORTED_TAG_NAME_ARR.join('|') + ')$')
  const ttUnsupportedExp = new RegExp('^(' + TT_UNSUPPORTED_TAG_NAME_ARR.join('|') + ')$')

  return [
    {
      supportedModes: ['swan'],
      test: baiduUnsupportedExp,
      swan: baiduUnsupportedTagError
    },
    {
      supportedModes: ['ali'],
      test: aliUnsupportedExp,
      ali: aliUnsupportedTagError
    },
    {
      supportedModes: ['qq'],
      test: qqUnsupportedExp,
      qq: qqUnsupportedTagError
    },
    {
      supportedModes: ['tt'],
      test: ttUnsupportedExp,
      tt: ttUnsupportedTagError
    }
  ]
}
