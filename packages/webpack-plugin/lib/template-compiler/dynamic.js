const { parseExp } = require('./parse-exps')

module.exports.createDynamic = function createDynamic (compiler) {
  function addIfCondition (el, condition) {
    if (!el.ifConditions) {
      el.ifConditions = []
    }
    el.ifConditions.push(condition)
  }

  function processIfConditions (el) {
    const prev = findPrevIfNode(el)
    if (prev) {
      addIfCondition(prev, {
        ifExp: !!el.elseif,
        block: el,
        __exps: el.elseif ? parseExp(el.elseif.exp) : ''
      })

      const tempNode = compiler.createASTElement('block', [])
      tempNode._tempIf = true // 创建一个临时的节点，后续遍历会删除
      compiler.replaceNode(el, tempNode)
    }
  }

  function findPrevIfNode (el) {
    const prevNode = compiler.findPrevNode(el)
    if (!prevNode) {
      return null
    }

    if (prevNode._tempIf) {
      return findPrevIfNode(prevNode)
    } else if (prevNode.if) {
      return prevNode
    } else {
      return null
    }
  }

  function processFor (vnode) {
    if (vnode.for) {
      vnode.for.__exps = parseExp(vnode.for.exp)
    }
  }

  function postProcessFor (vnode) {
    if (vnode.for) {
      delete vnode.for.raw
      delete vnode.for.exp
    }
  }

  function processAttrsMap (vnode, config) {
    if (vnode.attrsList && vnode.attrsList.length) {
      // 后序遍历，主要为了做剔除的操作
      for (let i = vnode.attrsList.length - 1; i >= 0; i--) {
        const attr = vnode.attrsList[i]
        if (attr.name === 'class') {
          processClass(attr)
        } else if (attr.name === 'style') {
          processStyle(attr)
        } else {
          const exps = getAttrExps(attr)
          if (exps) {
            attr.__exps = exps
          }
        }
      }
    }
  }

  function postProcessAttrsMap (vnode, config) {
    if (vnode.attrsList && vnode.attrsList.length) {
      // 后序遍历，主要为了做剔除的操作
      for (let i = vnode.attrsList.length - 1; i >= 0; i--) {
        const attr = vnode.attrsList[i]
        if (attr.name === 'class') {
          const { staticClassExp = '', dynamicClassExp = '' } = attr
          if (staticClassExp || dynamicClassExp) {
            delete attr.staticClassExp
            delete attr.dynamicClassExp
          }
        } else if (config.event.parseEvent(attr.name)) {
          // 原本的事件代理直接剔除，主要是基础模版的事件直接走代理形式，事件绑定名直接写死的，优化 astJson 体积
          vnode.attrsList.splice(i, 1)
        } else if (attr.name === 'style') {
          const { staticStyleExp = '', dynamicStyleExp = '' } = attr
          if (staticStyleExp || dynamicStyleExp) {
            delete attr.staticStyleExp
            delete attr.dynamicStyleExp
          }
        }
        if (attr.__exps) {
          delete attr.value
        }
      }
    }
  }

  function processClass (attr) {
    const { staticClassExp = '', dynamicClassExp = '' } = attr
    if (staticClassExp || dynamicClassExp) {
      attr.__exps = [parseExp(staticClassExp), parseExp(dynamicClassExp)]
    } else {
      const exps = getAttrExps(attr)
      if (exps) {
        attr.__exps = [exps]
      }
    }
  }

  function processStyle (attr) {
    const { staticStyleExp = '', dynamicStyleExp = '' } = attr
    if (staticStyleExp || dynamicStyleExp) {
      attr.__exps = [parseExp(staticStyleExp), parseExp(dynamicStyleExp)]
    } else {
      const exps = getAttrExps(attr)
      if (exps) {
        attr.__exps = [exps]
      }
    }
  }

  function getAttrExps (attr) {
    // 属性为单值的写法 <scroll-view enhenced></scroll-view>
    // 默认置为 true
    if (attr.value == null) {
      attr.value = '{{ true }}'
    }
    const parsed = compiler.parseMustache(attr.value)
    if (parsed.hasBinding && !attr.__exps) {
      return parseExp(parsed.result)
    }
  }

  function processText (vnode) {
    // text 节点
    if (vnode.type === 3) {
      // todo 全局 defs 静态数的处理? -> 目前已经都支持了
      const parsed = compiler.parseMustache(vnode.text)
      if (parsed.hasBinding) {
        vnode.__exps = parseExp(parsed.result)
        delete vnode.text
      }
      delete vnode.exps
    }
  }

  function postProcessDirectives (vnode, config) {
    const directives = Object.values(config.directive)
    if (vnode.attrsMap) {
      Object.keys(vnode.attrsMap).forEach(item => {
        if (directives.includes(item)) {
          compiler.getAndRemoveAttr(vnode, item)
        }
      })
    }
  }

  function postProcessIf (vnode, config) {
    delete vnode.ifProcessed
    if (vnode.if) {
      const parsedExp = vnode.if.exp
      addIfCondition(vnode, {
        ifExp: true,
        block: 'self',
        __exps: parseExp(parsedExp)
      })
      compiler.getAndRemoveAttr(vnode, config.directive.if)
      vnode.if = true
    } else if (vnode.elseif || vnode.else) {
      const directive = vnode.elseif
        ? config.directive.elseif
        : config.directive.else
      compiler.getAndRemoveAttr(vnode, directive)
      processIfConditions(vnode)
      delete vnode.elseif
      delete vnode.else
    }
    // 删除遍历过程中 if 替换的临时节点以及明确不会被渲染出来的 if 节点（即 {{ false }}）
    const children = vnode.children
    if (children && children.length) {
      for (let i = children.length - 1; i >= 0; i--) {
        if (children[i]._tempIf || children[i]._if === false) {
          children.splice(i, 1)
        }
      }
    }
  }

  function processWxs (vnode, config) {
    if (vnode.tag === config.wxs.tag) {
      const tempNode = compiler.createASTElement('block', [])
      compiler.replaceNode(vnode, tempNode)
      return tempNode
    }
    return null
  }

  const uselessAttrs = ['parent', 'exps', 'unary', 'attrsMap']
  const uselessArrAttrs = ['children', 'attrsList']

  function stringify (ast) {
    return JSON.stringify(ast, (k, v) => {
      if (uselessAttrs.includes(k)) return undefined
      if (uselessArrAttrs.includes(k) && v && !v.length) return undefined
      if (k === 'tag' && v === 'temp-node') return 'block'
      return v
    })
  }

  return {
    processFor,
    processClass,
    processStyle,
    processText,
    processWxs,
    processAttrsMap,
    postProcessIf,
    postProcessDirectives,
    postProcessAttrsMap,
    postProcessFor,
    stringify
  }
}
