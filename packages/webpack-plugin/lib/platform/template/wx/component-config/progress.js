const TAG_NAME = 'progress'

module.exports = function ({ print }) {
  const aliPropLog = print({ platform: 'ali', tag: TAG_NAME, isError: false })
  const aliEventLog = print({ platform: 'ali', tag: TAG_NAME, isError: false, type: 'event' })
  const baiduPropLog = print({ platform: 'baidu', tag: TAG_NAME, isError: false })
  const baiduEventLog = print({ platform: 'baidu', tag: TAG_NAME, isError: false, type: 'event' })
  const ttPropLog = print({ platform: 'bytedance', tag: TAG_NAME, isError: false })
  const ttEventLog = print({ platform: 'bytedance', tag: TAG_NAME, isError: false, type: 'event' })
  const jdPropLog = print({ platform: 'jd', tag: TAG_NAME, isError: false })
  const jdEventLog = print({ platform: 'jd', tag: TAG_NAME, isError: false, type: 'event' })
  const qqPropLog = print({ platform: 'qq', tag: TAG_NAME, isError: false })

  return {
    test: TAG_NAME,
    web (tag, { el }) {
      el.isBuiltIn = true
      return 'mpx-progress'
    },
    android (tag, { el }) {
      el.isBuiltIn = true
      return 'mpx-progress'
    },
    harmony (tag, { el }) {
      el.isBuiltIn = true
      return 'mpx-progress'
    },
    ios (tag, { el }) {
      el.isBuiltIn = true
      return 'mpx-progress'
    },
    props: [
      {
        test: /^(border-radius|font-size|color|active-mode|duration)$/,
        ali: aliPropLog
      },
      {
        test: /^(border-radius|font-size)$/,
        swan: baiduPropLog
      },
      {
        test: /^(activeColor|backgroundColor)$/,
        ali (obj) {
          const propsMap = {
            activeColor: 'active-color',
            backgroundColor: 'background-color'
          }
          obj.name = propsMap[obj.name]
          return obj
        },
        tt (obj) {
          const propsMap = {
            activeColor: 'active-color',
            backgroundColor: 'background-color'
          }
          obj.name = propsMap[obj.name]
          return obj
        }
      },
      {
        test: /^(show-info|border-radius|font-size|duration)$/,
        tt: ttPropLog
      },
      {
        test: /^(border-radius|font-size|duration|bindactiveend)$/,
        jd: jdPropLog
      },
      {
        test: /^(duration)$/,
        qq: qqPropLog
      }
    ],
    event: [
      {
        test: /^(activeend)$/,
        ali: aliEventLog,
        swan: baiduEventLog,
        tt: ttEventLog,
        jd: jdEventLog
      }
    ]
  }
}
