const TAG_NAME = 'form'

module.exports = function ({ print }) {
  const aliPropLog = print({ platform: 'ali', tag: TAG_NAME, isError: false })
  return {
    test: TAG_NAME,
    props: [
      {
        test: /^(report-submit-timeout)$/,
        ali: aliPropLog
      }
    ],
    event: [
      {
        test: /^(submit|reset)$/,
        ali (eventName) {
          const eventMap = {
            'submit': 'submit',
            'reset': 'reset'
          }
          return eventMap[eventName]
        }
      }
    ]
  }
}
