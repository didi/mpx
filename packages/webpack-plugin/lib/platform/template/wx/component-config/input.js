const TAG_NAME = 'input'

module.exports = function ({ print }) {
  /**
   * @type {function(isError: (number|boolean|string)?): void} aliLog
   * @desc - 无法转换时告知用户的通用方法，接受0个或1个参数，意为是否error级别
   */
  const aliLog = print('ali', TAG_NAME)
  const baiduLog = print('baidu', TAG_NAME)

  return {
    test: TAG_NAME,
    props: [
      {
        test: /^(cursor-spacing|auto-focus|adjust-position)$/,
        ali: aliLog()
      },
      {
        test: /^(auto-focus)$/,
        swan: baiduLog()
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
        ali: aliLog()
      }
    ]
  }
}
