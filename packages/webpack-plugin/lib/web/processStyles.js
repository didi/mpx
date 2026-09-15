const genComponentTag = require('../utils/gen-component-tag')

module.exports = function (styles, { loaderContext, ctorType, autoScope, moduleId }, callback) {
  let output = '/* styles */\n'
  const { hasUnoCSS, appInfo } = loaderContext.getMpx()
  const hasApp = !!appInfo.name
  if (styles.length) {
    styles.forEach((style) => {
      output += genComponentTag(style, {
        attrs (style) {
          const attrs = Object.assign({}, style.attrs)
          if (autoScope) attrs.scoped = true
          attrs.mpxStyleOptions = JSON.stringify({
            scoped: attrs.scoped,
            // query中包含module字符串会被新版vue-cli中的默认rules当做css-module处理
            mid: moduleId
          })
          delete attrs.scoped
          return attrs
        }
      })
      output += '\n'
    })
  }
  if (hasUnoCSS && (ctorType === 'app' || !hasApp)) {
    // 将unocss的引入放到App style之后，拉齐小程序中unocss覆盖全局样式的行为
    output += genComponentTag({
      tag: 'style',
      content: '@import \'uno.css\';'
    })
    output += '\n'
  }
  callback(null, {
    output
  })
}
