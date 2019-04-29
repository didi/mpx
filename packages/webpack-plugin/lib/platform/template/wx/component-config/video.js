const TAG_NAME = 'video'

module.exports = function ({ print }) {
  const baiduPropLog = print({ platform: 'baidu', tag: TAG_NAME, isError: false })
  const baiduEventLogError = print({ platform: 'baidu', tag: TAG_NAME, isError: false, type: 'event' })

  return {
    test: TAG_NAME,
    props: [
      {
        test: /^(direction|show-mute-btn|title|play-btn-position|enable-play-gesture|auto-pause-if-navigate|auto-pause-if-open-native|vslide-gesture|vslide-gesture-in-fullscreen)$/,
        swan: baiduPropLog
      }
    ],
    event: [
      {
        test: /^(play|progress)$/,
        swan: baiduEventLogError
      }
    ]
  }
}
