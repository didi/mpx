const TAG_NAME = 'cover-image'

module.exports = function ({ print }) {
  const aliPropLog = print({ platform: 'ali', tag: TAG_NAME, isError: false })
  const aliEventLog = print({ platform: 'ali', tag: TAG_NAME, isError: false, type: 'event' })
  return {
    test: TAG_NAME,
    props: [
      {
        test: /^scroll-top$/,
        ali: aliPropLog
      }
    ],
    event: [
      {
        test: /^(load|error)$/,
        ali: aliEventLog
      }
    ]
  }
}
