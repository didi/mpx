const TAG_NAME = 'movable-view'

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
        test: /^(inertia|out-of-bounds|damping|friction|scale|scale-min|scale-max|scale-value|animation|htouchmove|vtouchmove)$/,
        ali: aliLog()
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
        test: /^(scale)$/,
        ali: aliLog()
      }
    ]
  }
}
