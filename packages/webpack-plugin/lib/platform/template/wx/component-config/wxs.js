const TAG_NAME = 'wxs'

module.exports = function ({ print }) {
  const aliTagLogError = print({ tag: TAG_NAME, platform: 'ali', isError: true, type: 'tagRequiredProps' })
  return {
    // 匹配标签名，可传递正则
    test: TAG_NAME,
    ali (tagName, { attrsMap }) {
      console.log(tagName)
      if (!attrsMap.src) {
        return aliTagLogError('src')
      }
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
