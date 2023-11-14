const { isOriginTag, isBuildInTag } = require('../../../../utils/dom-tag-config')

module.exports = function () {
  return {
    waterfall: true,
    test: (input) => isOriginTag(input) || isBuildInTag(input),
    // 处理原生tag
    web (tag, data = {}) {
      // @see packages/webpack-plugin/lib/platform/json/wx/index.js webHTMLTagProcesser
      const newTag = `mpx-com-${tag}`
      const usingComponents = data.usingComponents || []
      // 存在同名组件，则返回新tag
      if (usingComponents.includes(newTag)) return newTag
      return tag
    }
  }
}
