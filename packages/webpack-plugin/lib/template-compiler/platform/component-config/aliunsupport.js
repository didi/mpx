// 支付宝小程序不支持的标签集合
const TAG_NAME_ARR = ['live-pusher', 'live-player', 'camera', 'video', 'audio', 'functional-page-navigator']

module.exports = function ({ print }) {
  const exp = new RegExp('^(' + TAG_NAME_ARR.join('|') + ')$')

  return {
    // 匹配标签名，可传递正则
    test: exp,
    ali (name) {
      print('ali', name, true)()()
    }
  }
}
