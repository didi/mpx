const selectorParser = require('postcss-selector-parser')
const { MPX_TAG_PAGE_SELECTOR } = require('../../utils/const')
// trans-special

module.exports = ({ id, isSupportedPage = false }) => {
  return {
    postcssPlugin: 'trans-special',
    Once: (root) => {
      root.each(function rewriteSelector (node) {
        if (!node.selector) return
        node.selector = selectorParser(selectors => {
          selectors.each(selector => {
            selector.each(n => {
              if (/^:host$/.test(n.value) || (isSupportedPage && /^page$/.test(n.value))) {
                const compoundSelectors = n.nodes || []
                n.replaceWith(selectorParser.className({
                  value: /^page$/.test(n.value) ? MPX_TAG_PAGE_SELECTOR : `host-${id}`
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
