const isValidIdentifierStr = require('../utils/is-valid-identifier-str')

function genIf (node) {
  node.ifProcessed = true
  return genIfConditions(node.ifConditions.slice())
}

function genIfConditions (conditions) {
  if (!conditions.length) return 'null'
  const condition = conditions.shift()
  if (condition.exp) {
    // 此处 condition.exp 无需括号包裹，condition.exp本身已经包含括号
    return `${condition.exp}?${genNode(condition.block)}:${genIfConditions(conditions)}`
  } else {
    return genNode(condition.block)
  }
}

function genFor (node) {
  node.forProcessed = true
  const index = node.for.index || 'index'
  const item = node.for.item || 'item'
  return `this.__iter(${node.for.exp}, function(${item},${index}){return ${genNode(node)}})`
}

const s = JSON.stringify

function mapAttrName (name) {
  if (name === 'class') return 'className'
  if (!isValidIdentifierStr(name)) return s(name)
  return name
}

function genNode (node, isRoot = false) {
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
        } else {
          const attrExpMap = (node.exps || []).reduce((map, { exp, attrName }) => {
            if (attrName) {
              map[attrName] = exp
            }
            return map
          }, {})
          if (node.slot) {
            const { name, slot } = node.slot
            exp += `this.__getSlot(${name ? s(name) : ''}${slot ? `, ${s(slot)}` : ''})`
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
              const childNode = node.children.map((child) => {
                return genNode(child)
              }).filter(fragment => fragment).join(',')

              // child可能为temp-node等无效节点，所以增加判断确保存在childNode再添加逗号
              if (childNode) {
                exp += ','
                exp += childNode
              }
            }
            exp += ')'
          }
        }
      } else {
        const nodes = node.children.map((child) => {
          return genNode(child)
        }).filter(fragment => fragment && fragment !== 'null')
        if (isRoot && nodes.length > 1) {
          // 如果存在多个根节点，使用 block 包裹
          exp = `createElement(getComponent("block"), null, ${nodes.join(',')})`
        } else {
          exp += nodes.join(',')
        }
      }
    }
  }
  return exp
}

module.exports = genNode
