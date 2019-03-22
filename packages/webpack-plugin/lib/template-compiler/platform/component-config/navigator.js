const TAG_NAME = 'navigator'

module.exports = function ({ print }) {
  /**
   * @type {function(isError: (number|boolean|string)?): void} aliLog
   * @desc - 无法转换时告知用户的通用方法，接受0个或1个参数，意为是否error级别
   */
  const aliLog = print('ali', TAG_NAME)

  return {
    test: TAG_NAME,
    props: [
      {
        test: /^(target|delta|app-id|path|extra-data|version)$/,
        ali: aliLog(1)
      },
      {
        test: /^(hover-stop-propagation|aria-label)$/,
        ali: aliLog()
      }
    ],
    event: [
      {
        test: /^(success|fail|complete)$/,
        ali: aliLog()
      }
    ]
  }
}
