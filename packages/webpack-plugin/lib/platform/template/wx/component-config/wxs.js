const TAG_NAME = 'wxs'

module.exports = function ({ print }) {
  return {
    // 匹配标签名，可传递正则
    test: TAG_NAME,
    ali () {
      return 'import-sjs'
    },
    swan () {
      return 'import-sjs'
    },
    qq () {
      return 'qs'
    },
    tt () {
      return 'sjs'
    },
    dd () {
      return 'dds'
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
