const TAG_NAME = 'navigator'

module.exports = function ({ print }) {
  const aliPropLog = print({ platform: 'ali', tag: TAG_NAME, isError: false })
  const aliPropLogError = print({ platform: 'ali', tag: TAG_NAME, isError: true })
  const aliEventLog = print({ platform: 'ali', tag: TAG_NAME, isError: false, type: 'event' })

  return {
    test: TAG_NAME,
    props: [
      {
        test: /^(target|delta|app-id|path|extra-data|version)$/,
        ali: aliPropLogError
      },
      {
        test: /^(hover-stop-propagation)$/,
        ali: aliPropLog
      }
    ],
    event: [
      {
        test: /^(success|fail|complete)$/,
        ali: aliEventLog
      }
    ]
  }
}
