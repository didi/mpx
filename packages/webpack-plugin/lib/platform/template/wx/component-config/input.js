const TAG_NAME = 'input'

module.exports = function ({ print }) {
  const aliPropLog = print({ platform: 'ali', tag: TAG_NAME, isError: false })
  const aliEventLog = print({ platform: 'ali', tag: TAG_NAME, isError: false, type: 'event' })
  const baiduPropLog = print({ platform: 'baidu', tag: TAG_NAME, isError: false })
  const ttPropLog = print({ platform: 'bytedance', tag: TAG_NAME, isError: false })

  return {
    test: TAG_NAME,
    props: [
      {
        test: /^(cursor-spacing|auto-focus|adjust-position)$/,
        ali: aliPropLog
      },
      {
        test: /^(auto-focus)$/,
        swan: baiduPropLog
      },
      {
        test: /^(placeholder-class|auto-focus|confirm-type|confirm-hold|adjust-position)$/,
        tt: ttPropLog
      }
    ],
    event: [
      {
        test: /^(input|focus|blur|confirm)$/,
        ali (eventName) {
          const eventMap = {
            'input': 'input',
            'focus': 'focus',
            'blur': 'blur',
            'confirm': 'confirm'
          }
          return eventMap[eventName]
        }
      },
      {
        test: /^(transition|animationfinish)$/,
        ali: aliEventLog
      }
    ]
  }
}
