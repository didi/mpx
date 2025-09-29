const selectorParser = require('postcss-selector-parser')
const { MPX_TAG_PAGE_SELECTOR } = require('../../utils/const')
// trans-special

module.exports = ({ id, transPage = false }) => {
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
                  value: `host-${id}`
                }))
                selector.insertAfter(n, compoundSelectors)
              }
              if (transPage && /^page$/.test(n.value)) {
                const compoundSelectors = n.nodes || []
                n.replaceWith(selectorParser.className({
                  value: MPX_TAG_PAGE_SELECTOR
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
