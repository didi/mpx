const TAG_NAME = 'text'

module.exports = function ({ print }) {
  const baiduPropLog = print({ platform: 'baidu', tag: TAG_NAME, isError: false })
  const qaPropLog = print({ platform: 'qa', tag: TAG_NAME, isError: false })
  const aliPropLog = print({ platform: 'ali', tag: TAG_NAME, isError: false })
  const ttPropLog = print({ platform: 'bytedance', tag: TAG_NAME, isError: false })
  const qqPropLog = print({ platform: 'qq', tag: TAG_NAME, isError: false })
  const iosPropLog = print({ platform: 'ios', tag: TAG_NAME, isError: false })
  const androidPropLog = print({ platform: 'android', tag: TAG_NAME, isError: false })
  const harmonyPropLog = print({ platform: 'harmony', tag: TAG_NAME, isError: false })

  return {
    test: TAG_NAME,
    web (tag, { el }) {
      if (el.hasModel) {
        el.isBuiltIn = true
      }

      if (el.isBuiltIn) {
        return 'mpx-text'
      } else {
        return 'span'
      }
    },
    ios (tag, { el }) {
      el.isBuiltIn = true
      return el.isSimple ? 'mpx-simple-text' : 'mpx-text'
    },
    android (tag, { el }) {
      el.isBuiltIn = true
      return el.isSimple ? 'mpx-simple-text' : 'mpx-text'
    },
    harmony (tag, { el }) {
      el.isBuiltIn = true
      return el.isSimple ? 'mpx-simple-text' : 'mpx-text'
    },
    props: [
      {
        test: /^(decode|user-select)$/,
        swan: baiduPropLog
      },
      {
        test: /^(user-select)$/,
        ali: aliPropLog,
        tt: ttPropLog,
        qq: qqPropLog,
        qa: qaPropLog
      },
      {
        test: /^(space|decode)$/,
        ios: iosPropLog,
        android: androidPropLog,
        harmony: harmonyPropLog
      },
      {
        test: /^(selectable|space|decode|use-built-in)$/,
        web (prop, { el }) {
          el.isBuiltIn = true
        },
        qa: qaPropLog
      },
      {
        test: /^(is-simple)$/,
        android (prop, { el }) {
          el.isSimple = true
          return false
        },
        harmony (prop, { el }) {
          el.isSimple = true
          return false
        },
        ios (prop, { el }) {
          el.isSimple = true
          return false
        }
      }
    ]
  }
}
