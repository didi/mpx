const selectorParser = require('postcss-selector-parser')
const { MPX_TAG_PAGE_SELECTOR } = require('../../utils/const')
// trans-special

module.exports = ({ id, transPage = false }) => {
  return {
    postcssPlugin: 'trans-special',
    Rule: (node) => {
      node.selector = selectorParser(selectors => {
        selectors.each(selector => {
          selector.each(n => {
            if (/^:host$/.test(n.value)) {
              n.nodes.forEach(compoundSelector => {
                compoundSelector.each(child => selector.insertBefore(n, child))
              })
              n.replaceWith(selectorParser.className({ value: `host-${id}` }))
            }
            if (transPage && n.type === 'tag' && n.value === 'page') {
              n.replaceWith(selectorParser.className({ value: MPX_TAG_PAGE_SELECTOR }))
            }
          })
        })
      }).processSync(node.selector)
    }
  }
}

module.exports.postcss = true
