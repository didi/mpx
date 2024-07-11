const TAG_NAME = 'image'
module.exports = function ({ print }) {
  const aliPropLog = print({ platform: 'ali', tag: TAG_NAME, isError: false })
  const baiduPropLog = print({ platform: 'baidu', tag: TAG_NAME, isError: false })
  const qqPropLog = print({ platform: 'qq', tag: TAG_NAME, isError: false })
  const jdPropLog = print({ platform: 'jd', tag: TAG_NAME, isError: false })
  const ttPropLog = print({ platform: 'bytedance', tag: TAG_NAME, isError: false })
  const qaPropLog = print({ platform: 'qa', tag: TAG_NAME, isError: false })
  const iosPropLog = print({ platform: 'ios', tag: TAG_NAME, isError: false })
  const androidPropLog = print({ platform: 'android', tag: TAG_NAME, isError: false })

  return {
    test: TAG_NAME,
    web (tag, { el }) {
      el.isBuiltIn = true
      return 'mpx-image'
    },
    ios (tag, { el }) {
      el.isBuiltIn = true
      return 'mpx-image'
    },
    android (tag, { el }) {
      el.isBuiltIn = true
      return 'mpx-image'
    },
    props: [
      {
        test: /^show-menu-by-longpress$/,
        ali: aliPropLog,
        swan: baiduPropLog,
        qq: qqPropLog,
        tt: ttPropLog
      },
      {
        test: /^webp|show-menu-by-longpress$/,
        jd: jdPropLog
      },
      {
        test: /^(mode|lazy-load|show-menu-by-longpress|webp|use-built-in)$/,
        web (prop, { el }) {
          el.isBuiltIn = true
        }
      },
      {
        test: /^(show-menu-by-longpress|webp)$/,
        qa: qaPropLog
      },
      {
        test: /^(show-menu-by-longpress|fade-in)$/,
        ios: iosPropLog,
        android: androidPropLog
      }
    ]
  }
}
