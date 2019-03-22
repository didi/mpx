const TAG_NAME = 'slider'

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
        test: /^(color|aria-label)$/,
        ali: aliLog()
      },
      {
        test: /^(selected-color|activeColor|backgroundColor|block-size|block-color)$/,
        ali (obj) {
          const propsMap = {
            'selected-color': 'active-color',
            'activeColor': 'active-color',
            'backgroundColor': 'background-color',
            'block-size': 'handle-size',
            'block-color': 'handle-color'
          }
          obj.name = propsMap[obj.name]
          return obj
        }
      }
    ],
    event: [
      {
        test: /^(change)$/,
        ali (eventName) {
          const eventMap = {
            'change': 'change',
            'changing': 'changing'
          }
          return eventMap[eventName]
        }
      }
    ]
  }
}
