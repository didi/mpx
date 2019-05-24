const TAG_NAME = 'camera'

module.exports = function ({ print }) {
  const baiduValueLogError = print({ platform: 'baidu', tag: TAG_NAME, isError: true, type: 'value' })
  const baiduEventLog = print({ platform: 'baidu', tag: TAG_NAME, isError: false })

  return {
    test: TAG_NAME,
    props: [
      {
        test: 'mode',
        swan ({ name, value }) {
          // 百度只有相机模式，也就是微信的mode=normal
          if (value !== 'normal') {
            baiduValueLogError({ name, value })
          }
          return false
        }
      }
    ],
    event: [
      {
        test: /^(scancode)$/,
        swan: baiduEventLog
      }
    ]
  }
}
