const TAG_NAME = 'swiper'

module.exports = function ({ print }) {
  const aliPropLog = print({ platform: 'ali', tag: TAG_NAME, isError: false })
  return {
    test: TAG_NAME,
    props: [
      {
        test: /^(item-id)$/,
        ali: aliPropLog
      }
    ]
  }
}
