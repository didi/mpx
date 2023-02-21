const TAG_NAME = 'live-player'

module.exports = function ({ print }) {
  const baiduValueLogError = print({ platform: 'baidu', tag: TAG_NAME, isError: true, type: 'value' })
  const baiduPropLog = print({ platform: 'baidu', tag: TAG_NAME, isError: false })
  const baiduEventLog = print({ platform: 'baidu', tag: TAG_NAME, isError: false, type: 'event' })
  const qqPropLog = print({ platform: 'qq', tag: TAG_NAME, isError: false })
  const qqEventLog = print({ platform: 'qq', tag: TAG_NAME, isError: false, type: 'event' })
  const ttEventLog = print({ platform: 'bytedance', tag: TAG_NAME, isError: false, type: 'event' })
  const ttPropLog = print({ platform: 'bytedance', tag: TAG_NAME, isError: false })
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
      },
      {
        test: /^(background-mute|picture-in-picture-mode)$/,
        qq: qqPropLog
      },
      {
        test: /^(mode|background-mute|min-cache|max-cache|sound-mode|auto-pause-if-navigate|auto-pause-if-open-native)$/,
        tt: ttPropLog
      }
    ],
    event: [
      {
        test: /^(audiovolumenotify|enterpictureinpicture|leavepictureinpicture)$/,
        qq: qqEventLog,
        swan: baiduEventLog
      },
      {
        test: /^(netstatus|audiovolumenotify|enterpictureinpicture|leavepictureinpicture)$/,
        tt: ttEventLog
      }
    ]
  }
}
