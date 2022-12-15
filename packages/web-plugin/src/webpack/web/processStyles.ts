import genComponentTag from '@mpxjs/compile-utils/gen-component-tag'

export default function (styles: Array<{ content: string; tag: string; attrs: Record<string, any> }>,
                         options: { autoScope?: boolean, moduleId?:string, ctorType: string},
                         callback: (err?: Error | null, result?: Record<string, string>) => void
) {
  let output = '/* styles */\n'
  if (styles.length) {
    styles.forEach((style) => {
      output += genComponentTag(style, {
        attrs (style: {attrs: Record<string, string | boolean>}) {
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
