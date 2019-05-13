const TAG_NAME = 'wxs'

module.exports = function () {
  /**
   * @type {function(isError: (number|boolean|string)?): void} aliLog
   * @desc - 无法转换时告知用户的通用方法，接受0个或1个参数，意为是否error级别
   */
  return {
    // 匹配标签名，可传递正则
    test: TAG_NAME,
    ali () {
      return 'import-sjs'
    },
    swan () {
      return 'filter'
    },
    // 组件属性中的差异部分
    props: [
      {
        test: 'src',
        ali (obj) {
          obj.name = 'from'
          return obj
        }
      },
      {
        test: 'module',
        ali (obj) {
          obj.name = 'name'
          return obj
        }
      }
    ]
  }
}
