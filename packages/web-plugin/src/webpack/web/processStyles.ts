import genComponentTag from '@mpxjs/compile-utils/gen-component-tag'

export default function (styles: any, options: any, callback: any) {
  let output = '/* styles */\n'
  if (styles.length) {
    styles.forEach((style: any) => {
      output += genComponentTag(style, {
        attrs (style: any) {
          const attrs = Object.assign({}, style.attrs)
          if (options.autoScope) attrs.scoped = true
          attrs.mpxStyleOptions = JSON.stringify({
            // scoped: !!options.autoScope,
            // query中包含module字符串会被新版vue-cli中的默认rules当做css-module处理
            mid: options.moduleId
          })
          return attrs
        }
      })
      output += '\n'
    })
    output += '\n'
  }
  callback(null, {
    output
  })
}
