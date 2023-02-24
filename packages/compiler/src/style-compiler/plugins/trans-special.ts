import { Plugin } from 'postcss'
import selectorParser from 'postcss-selector-parser'
// trans-special

export default ({ id }: { id: string }) => {
  return <Plugin>{
    postcssPlugin: 'trans-special',
    Once: root => {
      root.each(function rewriteSelector(node) {
        // @ts-ignore
        if (!node.selector) return
        // @ts-ignore
        node.selector = selectorParser(selectors => {
          selectors.each(selector => {
            selector.each(n => {
              if (/^:host$/.test(n.value!)) {
                // @ts-ignore
                const compoundSelectors = n.nodes
                n.replaceWith(
                  selectorParser.className({
                    value: 'host-' + id
                  })
                )
                selector.insertAfter(n, compoundSelectors)
              }
            })
          })
          // @ts-ignore
        }).processSync(node.selector)
      })
    }
  }
}

module.exports.postcss = true
