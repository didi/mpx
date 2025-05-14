const TAG_NAME = 'rich-text'

module.exports = function ({ print }) {
  const aliPropLog = print({ platform: 'ali', tag: TAG_NAME, isError: false })
  const baiduPropLog = print({ platform: 'baidu', tag: TAG_NAME, isError: false })
  const ttPropLog = print({ platform: 'bytedance', tag: TAG_NAME, isError: false })
  const jdPropLog = print({ platform: 'jd', tag: TAG_NAME, isError: false })

  return {
    test: TAG_NAME,
    web (tag, { el }) {
      el.isBuiltIn = true
      return 'mpx-rich-text'
    },
    ios (tag, { el }) {
      el.isBuiltIn = true
      return 'mpx-rich-text'
    },
    android (tag, { el }) {
      el.isBuiltIn = true
      return 'mpx-rich-text'
    },
    harmony (tag, { el }) {
      el.isBuiltIn = true
      return 'mpx-rich-text'
    },
    props: [
      {
        test: /^(space)$/,
        ali: aliPropLog,
        swan: baiduPropLog,
        tt: ttPropLog,
        jd: jdPropLog
      },
      {
        test: /^(nodes)$/,
        jd: jdPropLog
      }
    ]
  }
}
