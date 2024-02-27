const { dash2hump } = require('../utils/hump-dash')

function findPrevNode (node) {
  const parent = node.parent
  if (parent) {
    let index = parent.children.indexOf(node)
    while (index--) {
      const preNode = parent.children[index]
      if (preNode.type === 1) {
        return preNode
      }
    }
  }
}

function genIf (node) {
  node.ifProcessed = true
  return `if(${node.if.exp}){\n${genNode(node)}}\n`
}

function genElseif (node) {
  node.elseifProcessed = true
  if (node.for) {
    error$1(`wx:elif (wx:elif="${node.elseif.raw}") invalidly used on the for-list <"${node.tag}"> which has a wx:for directive, please create a block element to wrap the for-list and move the if-directive to it`)
    return
  }
  const preNode = findPrevNode(node)
  if (preNode && (preNode.if || preNode.elseif)) {
    return `else if(${node.elseif.exp}){\n${genNode(node)}}\n`
  } else {
    error$1(`wx:elif (wx:elif="${node.elseif.raw}") invalidly used on the element <"${node.tag}"> without corresponding wx:if or wx:elif.`)
  }
}

function genElse (node) {
  node.elseProcessed = true
  if (node.for) {
    error$1(`wx:else invalidly used on the for-list <"${node.tag}"> which has a wx:for directive, please create a block element to wrap the for-list and move the if-directive to it`)
    return
  }
  const preNode = findPrevNode(node)
  if (preNode && (preNode.if || preNode.elseif)) {
    return `else{\n${genNode(node)}}\n`
  } else {
    error$1(`wx:else invalidly used on the element <"${node.tag}"> without corresponding wx:if or wx:elif.`)
  }
}

function genFor (node) {
  node.forProcessed = true
  const index = node.for.index || 'index'
  const item = node.for.item || 'item'
  return `_i(${node.for.exp}, function(${item},${index}){\n${genNode(node)}});\n`
}

const s = JSON.stringify

function mapAttrName (name) {
  if (name === 'class') return 'className'
  return dash2hump(name)
}

export default function genNode (node) {
  let exp = ''
  if (node) {
    if (node.type === 3) {
      if (!node.isComment) {
        if (node.exps) {
          exp += `,${node.exps[0].exp}`
        } else {
          exp += `,${s(node.text)}`
        }
      }
    }
    if (node.type === 1) {
      if (node.tag !== 'temp-node') {
        if (node.for && !node.forProcessed) {
          exp += genFor(node)
        } else if (node.if && !node.ifProcessed) {
          exp += genIf(node)
        } else if (node.elseif && !node.elseifProcessed) {
          exp += genElseif(node)
        } else if (node.else && !node.elseProcessed) {
          exp += genElse(node)
        } else {
          exp += `createElement(${node.isComponent ? `components[${s(node.tag)}]` : s(node.tag)}`
          if (node.attrsList.length) {
            exp += ',{'
            const attrExpMap = (node.exps || []).reduce((map, { exp, attrName }) => {
              if (attrName) {
                map[attrName] = exp
              }
              return map
            }, {})
            node.attrsList.forEach(({ name, value }, index) => {
              exp += `${index === 0 ? '' : ','}${mapAttrName(name)}:`
              exp += attrExpMap[name] ? attrExpMap[name] : s(value)
            })
            exp += '}'
          } else {
            exp += ',undefined'
          }

          if (!node.unary && node.children.length) {
            node.children.forEach(function (child) {
              exp += `,${genNode(child)}`
            })
          }
          exp += ')'
        }
      } else {
        node.children.forEach(function (child) {
          exp += `,${genNode(child)}`
        })
      }
    }
  }
  return exp
}

