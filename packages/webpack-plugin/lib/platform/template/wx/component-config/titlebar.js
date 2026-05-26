const TAG_NAME = 'titlebar'

module.exports = function () {
  return {
    // 匹配标签名，可传递正则
    test: TAG_NAME,
    web (tag, { el }) {
      el.isBuiltIn = true
      return 'mpx-titlebar'
    }
  }
}
