const TAG_NAME = 'live-player'

module.exports = function ({ print }) {
  const baiduValueLogError = print({ platform: 'baidu', tag: TAG_NAME, isError: true, type: 'value' })
  const baiduPropLog = print({ platform: 'baidu', tag: TAG_NAME, isError: false })

  return {
    test: TAG_NAME,
    props: [
      {
        test: 'mode',
        swan ({ name, value }) {
          // 百度只有直播模式，也就是微信的mode=live
          if (value !== 'live') {
            baiduValueLogError({ name, value })
          }
          return false
        }
      },
      {
        test: /^(sound-mode|auto-pause-if-navigate|auto-pause-if-open-native)$/,
        swan: baiduPropLog
      }
    ]
  }
}
