const TAG_NAME = 'swiper-item'

module.exports = function ({ print }) {
  const aliPropLog = print({ platform: 'ali', tag: TAG_NAME, isError: false })
  const qaPropLog = print({ platform: 'qa', tag: TAG_NAME, isError: false })
  const ttPropLog = print({ platform: 'bytedance', tag: TAG_NAME, isError: false })
  const baiduPropLog = print({ platform: 'baidu', tag: TAG_NAME, isError: false })
  const qqPropLog = print({ platform: 'qq', tag: TAG_NAME, isError: false })
  const iosPropLog = print({ platform: 'ios', tag: TAG_NAME, isError: false })
  const androidPropLog = print({ platform: 'android', tag: TAG_NAME, isError: false })
  const harmonyPropLog = print({ platform: 'harmony', tag: TAG_NAME, isError: false })

  return {
    test: TAG_NAME,
    web (tag, { el }) {
      el.isBuiltIn = true
      return 'mpx-swiper-item'
    },
    ios (tag, { el }) {
      el.isBuiltIn = true
      return 'mpx-swiper-item'
    },
    android (tag, { el }) {
      el.isBuiltIn = true
      return 'mpx-swiper-item'
    },
    harmony (tag, { el }) {
      el.isBuiltIn = true
      return 'mpx-swiper-item'
    },
    props: [
      {
        test: /^(item-id)$/,
        ali: aliPropLog,
        ios: iosPropLog,
        android: androidPropLog,
        harmony: harmonyPropLog
      },
      {
        test: /^(skip-hidden-item-layout)$/,
        qa: qaPropLog,
        ali: aliPropLog,
        tt: ttPropLog,
        swan: baiduPropLog,
        qq: qqPropLog
      }
    ]
  }
}
