const TAG_NAME = 'video'

module.exports = function ({ print }) {
  const baiduPropLog = print({ platform: 'baidu', tag: TAG_NAME, isError: false })
  const baiduEventLogError = print({ platform: 'baidu', tag: TAG_NAME, isError: false, type: 'event' })
  const qqPropLog = print({ platform: 'qq', tag: TAG_NAME, isError: false })

  return {
    test: TAG_NAME,
    props: [
      {
        test: /^(direction|show-mute-btn|title|play-btn-position|enable-play-gesture|auto-pause-if-navigate|auto-pause-if-open-native|vslide-gesture|vslide-gesture-in-fullscreen)$/,
        swan: baiduPropLog
      },
      {
        test: /^(vslide-gesture)$/,
        qq (obj) {
          const propsMap = {
            'vslide-gesture': 'page-gesture'
          }
          obj.name = propsMap[obj.name]
          return obj
        }
      },
      {
        test: /^(vslide-gesture-in-fullscreen)$/,
        qq: qqPropLog
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
