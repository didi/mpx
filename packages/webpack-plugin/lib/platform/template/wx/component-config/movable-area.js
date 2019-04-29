const TAG_NAME = 'movable-area'

module.exports = function ({ print }) {
  const aliPropLog = print({ platform: 'ali', tag: TAG_NAME, isError: false })
  return {
    test: TAG_NAME,
    props: [
      {
        test: /^(scale-area)$/,
        ali: aliPropLog
      }
    ]
  }
}
