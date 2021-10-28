const postcss = require('postcss')
const selectorParser = require('postcss-selector-parser')

module.exports = postcss.plugin('trans-special', ({ id }) => root => {
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
    }).process(node.selector).result
  })
})
