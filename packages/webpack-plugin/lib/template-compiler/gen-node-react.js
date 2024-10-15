const isValidIdentifierStr = require('../utils/is-valid-identifier-str')

function genIf (node) {
  node.ifProcessed = true
  return genIfConditions(node.ifConditions.slice())
}

function genIfConditions (conditions) {
  if (!conditions.length) return 'null'
  const condition = conditions.shift()
  if (condition.exp) {
    return `(${condition.exp})?${genNode(condition.block)}:${genIfConditions(conditions)}`
  } else {
    return genNode(condition.block)
  }
}

function genFor (node) {
  node.forProcessed = true
  const index = node.for.index || 'index'
  const item = node.for.item || 'item'
  return `_i(${node.for.exp}, function(${item},${index}){return ${genNode(node)}})`
}

function genRef (node) {
  node.refProcessed = true
  const refs = node.refs.map(item => `[${item.key}, "${item.type}", "${item.prefix}", ${item.selectors}]`)
  return `_r([${refs}]), ` + genNode(node)
}

const s = JSON.stringify

function mapAttrName (name) {
  if (name === 'class') return 'className'
  if (!isValidIdentifierStr(name)) return s(name)
  return name
}

function genNode (node) {
  let exp = ''
  if (node) {
    if (node.type === 3) {
      if (!node.isComment) {
        if (node.exps) {
          exp += `${node.exps[0].exp}`
        } else {
          exp += `${s(node.text)}`
        }
      }
    }
    if (node.type === 1) {
      if (node.tag !== 'temp-node') {
        if (node.for && !node.forProcessed) {
          exp += genFor(node)
        } else if (node.if && !node.ifProcessed) {
          exp += genIf(node)
        } else if (node.refs && !node.refProcessed) {
          exp += genRef(node)
        } else {
          const attrExpMap = (node.exps || []).reduce((map, { exp, attrName }) => {
            if (attrName) {
              map[attrName] = exp
            }
            return map
          }, {})
          if (node.slot) {
            const name = node.slot.name
            exp += `__getSlot(${name ? s(name) : ''})`
          } else {
            exp += `createElement(${`getComponent(${node.is || s(node.tag)})`}`
            if (node.attrsList.length) {
              const attrs = []
              node.attrsList && node.attrsList.forEach(({ name, value }) => {
                const attrExp = attrExpMap[name] ? attrExpMap[name] : s(value)
                attrs.push(`${mapAttrName(name)}: ${attrExp}`)
              })
              exp += `, { ${attrs.join(', ')} }`
            } else {
              exp += ', null'
            }

            if (!node.unary && node.children.length) {
              exp += ','
              exp += node.children.map((child) => {
                return genNode(child)
              }).filter(fragment => fragment).join(',')
            }
            exp += ')'
          }
        }
      } else {
        exp += node.children.map((child) => {
          return genNode(child)
        }).filter(fragment => fragment).join(',')
      }
    }
  }
  return exp
}

module.exports = genNode
