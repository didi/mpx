import selectorParser from 'postcss-selector-parser'
// trans-special

export default ({ id }) => {
  return {
    postcssPlugin: 'trans-special',
    Once: (root) => {
      root.each(function rewriteSelector (node) {
        if (!node.selector) return
        node.selector = selectorParser(selectors => {
          selectors.each(selector => {
            selector.each(n => {
              if (/^:host$/.test(n.value)) {
                const compoundSelectors = n.nodes
                n.replaceWith(selectorParser.className({
                  value: 'host-' + id
                }))
                selector.insertAfter(n, compoundSelectors)
              }
            })
          })
        }).processSync(node.selector)
      })
    }
  }
}

module.exports.postcss = true
