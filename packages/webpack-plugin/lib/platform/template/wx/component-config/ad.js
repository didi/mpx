const TAG_NAME = 'ad'

module.exports = function ({ print }) {
  const ttValueWarningLog = print({ platform: 'bytedance', type: 'value', tag: TAG_NAME, isError: false })

  return {
    test: TAG_NAME,
    props: [
      {
        test: /^ad-type$/,
        tt (obj) {
          obj.name = 'type'
          if (obj.value === 'grid') {
            ttValueWarningLog({ name: 'type', value: 'grid' })
          }
          return obj
        }
      }
    ]
  }
}
