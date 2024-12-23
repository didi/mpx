const selectorParser = require('postcss-selector-parser')
// scope-id
function isSpaceCombinator (node) {
  return node.type === 'combinator' && /^\s+$/.test(node.value)
}
module.exports = ({ id }) => {
  return {
    postcssPlugin: 'scope-id',
    Once: (root) => {
      const keyframes = Object.create(null)

      root.each(function rewriteSelector (node) {
        if (!node.selector) {
          // handle media queries
          if (node.type === 'atrule') {
            if (node.name === 'media' || node.name === 'supports') {
              node.each(rewriteSelector)
            } else if (/-?keyframes$/.test(node.name)) {
              // register keyframes
              keyframes[node.params] = node.params = node.params + '-' + id
            }
          }
          return
        }
        if (node.selector === ':host') return
        node.selector = selectorParser(selectors => {
          selectors.each(selector => {
            let node = null
            selector.each(n => {
              // ">>>" combinator
              if (n.type === 'combinator' && n.value === '>>>') {
                n.value = ' '
                n.spaces.before = n.spaces.after = ''
                return false
              }
              if (n.type === 'pseudo' && n.value === ':deep') {
                if (n.nodes.length) {
                  let last = n
                  n.nodes[0].each((ss) => {
                    selector.insertAfter(last, ss)
                    last = ss
                  })
                  const prev = n.prev()
                  if (!prev || !isSpaceCombinator(prev)) {
                    selector.insertAfter(
                      n,
                      selectorParser.combinator({
                        value: ' '
                      })
                    )
                  }
                  n.remove()
                } else {
                  const prev = n.prev()
                  if (prev && isSpaceCombinator(prev)) {
                    prev.remove()
                  }
                  n.remove()
                }
                return false
              }
              // /deep/ alias for >>>, since >>> doesn't work in SASS
              if (n.type === 'tag' && n.value === '/deep/') {
                const prev = n.prev()
                if (prev && isSpaceCombinator(prev)) {
                  prev.remove()
                }
                n.remove()
                return false
              }
              if (n.type !== 'pseudo' && n.type !== 'combinator') {
                node = n
              }
            })
            // 对于page selector不添加scope id
            if (node && node.type === 'tag' && node.value === 'page') return
            selector.insertAfter(node, selectorParser.className({
              value: id
            }))
          })
        }).processSync(node.selector)
      })

      // If keyframes are found in this <style>, find and rewrite animation names
      // in declarations.
      // Caveat: this only works for keyframes and animation rules in the same
      // <style> element.
      if (Object.keys(keyframes).length) {
        root.walkDecls(decl => {
          // individual animation-name declaration
          if (/-?animation-name$/.test(decl.prop)) {
            decl.value = decl.value.split(',')
              .map(v => keyframes[v.trim()] || v.trim())
              .join(',')
          }
          // shorthand
          if (/-?animation$/.test(decl.prop)) {
            decl.value = decl.value.split(',')
              .map(v => {
                const vals = v.trim().split(/\s+/)
                const i = vals.findIndex(val => keyframes[val])
                if (i !== -1) {
                  vals.splice(i, 1, keyframes[vals[i]])
                  return vals.join(' ')
                } else {
                  return v
                }
              })
              .join(',')
          }
        })
      }
    }
  }
}

module.exports.postcss = true
