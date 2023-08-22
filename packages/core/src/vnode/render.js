import cssSelect from './css-select'

export default function genVnodeTree (vnodeAst, contextScope, cssList) {
  // 引用的 vnodeAst 浅复制，解除引用
  vnodeAst = cloneNode(vnodeAst)
  // 获取实例 uid
  const uid = contextScope[0]?.__mpxProxy?.uid
  function simpleNormalizeChildren (children) {
    for (let i = 0; i < children.length; i++) {
      if (Array.isArray(children[i])) {
        return Array.prototype.concat.apply([], children)
      }
    }
    return children
  }

  function cloneNode (el) {
    const clone = Object.assign({}, el)
    if (el.parent) clone.parent = null
    if (el.children) {
      clone.children = []
      el.children.forEach((child) => {
        addChild(clone, cloneNode(child))
      })
    }
    return clone
  }

  function addChild (parent, newChild, before) {
    parent.children = parent.children || []
    if (before) {
      parent.children.unshift(newChild)
    } else {
      parent.children.push(newChild)
    }
    // newChild.parent = parent
  }

  function genVnodeTree (node) {
    if (node.type === 1) {
      if (node.for && !node.forProcessed) {
        return genFor(node)
      } else if (node.if && !node.ifProcessed) {
        return genIf(node)
      } else {
        const data = genData(node)
        const children = genChildren(node)
        // todo aliasTag 优化
        // return _c(node.tag, data, children);
        return _c(node.aliasTag || node.tag, data, children)
      }
    } else if (node.type === 3) {
      return genText(node)
    }
  }

  function getExpressionValue (exps) {
    let scopeValue = null
    // 单值的情况，基础类型
    if (exps.length === 1 && exps[0].value) {
      scopeValue = exps[0].value
      return scopeValue
    }
    for (let i = 0; i < exps.length; i++) {
      // exps 第一个 identifier 默认为根数据，后续字段的查找都在这个根数据之下
      if (i === 0) {
        scopeValue = getScopeValue(exps[0].name)
        continue
      }
      if (Array.isArray(exps[i])) {
        const identifierValue = getExpressionValue(exps[i])
        scopeValue = scopeValue[identifierValue]
      } else {
        const identifierKey = exps[i].name || exps[i].value
        scopeValue = scopeValue[identifierKey]
      }
    }
    return scopeValue
  }

  function getScopeValue (identifier) {
    let scopeLength = contextScope.length
    let value = null
    while (scopeLength--) {
      const scope = contextScope[scopeLength]
      if (identifier in scope) {
        value = scope[identifier]
        break
      }
    }
    return value
  }

  const tagREG = /\{\{((?:.|\n|\r)+?)\}\}(?!})/g
  function getTextValue (exps = [], str = '') {
    const expsMap = {}
    exps.forEach(({ rawExp, exps }) => {
      const value = getExpressionValue(exps)
      expsMap[rawExp] = value
    })

    str = str.replace(tagREG, function (matcher) {
      // 去除 {{}} 做字符串匹配
      const expression = matcher.slice(2, -2).trim()
      // todo 一些边界case处理，拿不到值的情况
      if (expsMap[expression]) {
        return expsMap[expression]
      }
      return ''
    })

    return str
  }

  function _c (tag, data = {}, children = []) {
    if (Array.isArray(data)) {
      children = data
      data = {}
    }
    if (typeof tag === 'object') {
      return tag
    }

    children = simpleNormalizeChildren(children)

    return {
      // tagName: tag,
      nodeType: tag,
      data,
      children
    }
  }

  function genData (node) {
    if (!node.attrsList) {
      return {}
    }

    const res = {
      uid
    }
    node.attrsList.forEach((attr) => {
      if (attr.helper && (attr.name === 'class' || attr.name === 'style')) {
        // todo 引入辅助函数处理 class/style，合并形式
        const value = attr.__exps__.reduce((preVal, curExpression) => {
          preVal.push(getExpressionValue(curExpression))
          return preVal
        }, [])
        res[attr.name] = value
      } else if (attr.name === 'data-eventconfigs') {
        const eventMap = {}
        attr.__exps__?.forEach(({ eventName, exps }) => {
          eventMap[eventName] = exps.reduce((preVal, curVal) => {
            preVal.push(curVal.map(v => getExpressionValue(v)))
            return preVal
          }, [])
        })
        res.dataEventconfigs = eventMap
      } else {
        res[attr.name] = attr.__exps__
          ? getExpressionValue(attr.__exps__)
          : attr.value
      }
    })
    return res
  }

  function genChildren (node) {
    const res = []
    const children = node.children || []
    if (children.length) {
      children.forEach((item) => {
        res.push(genNode(item))
      })
    }
    return res
  }

  function genNode (node) {
    if (node.type === 1) {
      return genVnodeTree(node)
    } else if (node.type === 3 && node.isComment) {
      return ''
      // TODO: 注释暂不处理
      // return _genComment(node)
    } else {
      return genText(node) // 文本节点统一通过 _genText 来生成，type = 2(带有表达式的文本，在 mpx 统一处理为了3) || type = 3(纯文本，非注释)
    }
  }

  function genText (node) {
    return {
      // tagName: "#text",
      nodeType: '#text',
      content: getTextValue(node.__exps__, node.text)
    }
  }

  function genFor (node) {
    node.forProcessed = true

    const itemKey = node.for.item || 'item'
    const indexKey = node.for.index || 'index'
    const scope = {
      [itemKey]: null,
      [indexKey]: null
    }

    const forExp = node.for

    const res = []

    getExpressionValue(forExp.__exps__).forEach(function (item, index) {
      // item、index 模板当中如果没申明，需要给到默认值
      scope[itemKey] = item
      scope[indexKey] = index

      contextScope.push(scope)

      // 针对 for 循环避免每次都操作的同一个 node 导致数据的污染的问题
      res.push(genVnodeTree(cloneNode(node)))

      contextScope.pop()
    })

    return res
  }

  // 对于 if 而言最终生成 <= 1 节点
  function genIf (node) {
    if (!node.ifConditions) {
      node.ifConditions = []
      return {} // 一个空节点
    }
    node.ifProcessed = true

    const ifConditions = node.ifConditions.slice()

    let res = {} // 空节点
    for (let i = 0; i < ifConditions.length; i++) {
      const condition = ifConditions[i]
      // else 节点
      if (!condition.exp) {
        res = genVnodeTree(condition.block)
        break
      }
      // 非 else 节点
      const identifierValue = getExpressionValue(condition.__exps__)
      // console.log(condition.__exps__, identifierValue)
      if (identifierValue) {
        res = genVnodeTree(condition.block === 'self' ? node : condition.block)
        break
      }
    }
    return res
  }

  // function genIfConditions(conditions, node) {
  //   if (!conditions.length) {
  //     return {} // 返回一个空节点
  //   }

  //   const condition = conditions.shift()
  //   if (condition.exp) {
  //   } else {
  //     return genVnodeTree(condition.block)
  //   }
  // }

  function genVnodeWithStaticCss (vnodeTree) {
    cssList.forEach((item) => {
      const [selector, style] = item
      const nodes = cssSelect(selector)(vnodeTree)
      nodes?.forEach((node) => {
        node.data.style = node.data.style ? style + node.data.style : style
      })
    })

    return vnodeTree
  }

  return genVnodeWithStaticCss(genVnodeTree(vnodeAst))
}
