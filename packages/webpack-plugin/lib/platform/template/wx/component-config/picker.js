const TAG_NAME = 'picker'

module.exports = function ({ print }) {
  const aliPropLogError = print({ platform: 'ali', tag: TAG_NAME, isError: true })
  const aliEventLog = print({ platform: 'ali', tag: TAG_NAME, isError: false, type: 'event' })
  const jdPropLog = print({ platform: 'jd', tag: TAG_NAME, isError: true })
  return {
    test: TAG_NAME,
    web (tag, { el }) {
      el.isBuiltIn = true
      return 'mpx-picker'
    },
    props: [
      {
        test: 'mode',
        ali (attr) {
          if (attr.value !== 'selector') {
            aliPropLogError(attr)
          }
          return false
        }
      },
      {
        test: 'header-text',
        ali ({ name }) {
          const propsMap = {
            'header-text': 'title'
          }
          return propsMap[name]
        },
        jd: jdPropLog
      }
    ],
    event: [
      {
        test: /^(change)$/,
        ali (eventName) {
          const eventMap = {
            'change': 'change'
          }
          return eventMap[eventName]
        }
      },
      {
        test: /^(cancel)$/,
        ali: aliEventLog
      }
    ]
  }
}
