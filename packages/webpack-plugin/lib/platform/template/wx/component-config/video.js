const TAG_NAME = 'video'

module.exports = function ({ print }) {
  const baiduPropLog = print({ platform: 'baidu', tag: TAG_NAME, isError: false })
  const baiduEventLogError = print({ platform: 'baidu', tag: TAG_NAME, isError: false, type: 'event' })
  const qqPropLog = print({ platform: 'qq', tag: TAG_NAME, isError: false })
  const ttPropLog = print({ platform: 'bytedance', tag: TAG_NAME, isError: false })
  const ttEventLogError = print({ platform: 'bytedance', tag: TAG_NAME, isError: false, type: 'event' })
  
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
      },
      {
        test: /^(duration|controls|danmu-list|danmu-btn|enable-danmu|loop|muted|initial-time|page-gesture|direction|show-progress|show-fullscreen-btn|show-play-btn|show-center-play-btn|enable-progress-gesture|object-fit|show-mute-btn|title|play-btn-position|enable-play-gesture|auto-pause-if-navigate|auto-pause-if-open-native|vslide-gesture|vslide-gesture-in-fullscreen)$/,
        tt: ttPropLog
      }
    ],
    event: [
      {
        test: /^(play|progress)$/,
        swan: baiduEventLogError
      },
      {
        test: /^(timeupdate|fullscreenchange|waiting|progress)$/,
        tt: ttEventLogError
      }
    ]
  }
}
