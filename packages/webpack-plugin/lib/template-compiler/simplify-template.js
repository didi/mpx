const {
  getAndRemoveAttr,
  parseMustache,
  findPrevNode,
  replaceNode,
  createASTElement
} = require('./compiler')
const allConfigs = require('../config')
const { parseExp } = require('./parse-exps')

function processIf(vnode, config) {
  delete vnode.ifProcessed

  if (vnode.if) {
    getAndRemoveAttr(vnode, config.directive.if)
    const parsedExp = vnode.if.exp
    addIfCondition(vnode, {
      ifExp: true,
      block: 'self',
      __exps: parseExp(parsedExp)
    })

    vnode.if = true
  } else if (vnode.elseif || vnode.else) {
    const directive = vnode.elseif
      ? config.directive.elseif
      : config.directive.else
    getAndRemoveAttr(vnode, directive)
    processIfConditions(vnode)

    delete vnode.elseif
    delete vnode.else
  } else if (typeof vnode._if === 'boolean') {
    // 如果节点有 _if 属性，那么其值为一个常量值
    // 如果值为 true，一定会渲染这一个节点，当成一个普通节点即可，因为编译阶段已经 delete if
    if (vnode._if === true) {
      // do nothing
    }

    // 如果值为 false，后续的遍历过程会删除这个节点，本来也不需要被渲染出来
    if (vnode._if === false) {
      // do nothing
    }
  }
}

function addIfCondition(el, condition) {
  if (!el.ifConditions) {
    el.ifConditions = []
  }
  el.ifConditions.push(condition)
}

function processIfConditions(el) {
  const prev = findPrevIfNode(el)
  if (prev) {
    addIfCondition(prev, {
      ifExp: !!el.elseif,
      block: el,
      __exps: el.elseif ? parseExp(el.elseif.exp) : ''
    })

    const tempNode = createASTElement('block', [])
    tempNode._tempIf = true // 创建一个临时的节点，后续遍历会删除
    replaceNode(el, tempNode)
  }
}

function findPrevIfNode(el) {
  const prevNode = findPrevNode(el)
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

function processFor(vnode) {
  if (vnode.for) {
    vnode.for.__exps = parseExp(vnode.for.exp)

    delete vnode.for.raw
    delete vnode.for.exp
  }
}

function processAttrsMap(vnode, config) {
  processDirectives(vnode, config)

  if (vnode.attrsList && vnode.attrsList.length) {
    vnode.attrsList.forEach(attr => {
      if (attr.name === 'class') {
        processClass(attr)
      } else if (attr.name === 'style') {
        processStyle(attr)
      } else if (attr.name === 'data-eventconfigs') {
        processBindEvent(attr)
      } else {
        const exps = getAttrExps(attr)
        if (exps) {
          attr.__exps = exps
        }
      }

      if (attr.__exps) {
        delete attr.value
      }
    })
  } else {
    // 如果长度为空，ast 产出物可以不输出
    delete vnode.attrsList
  }

  delete vnode.attrsMap
}

function processClass(attr) {
  const { staticClassExp = '', dynamicClassExp = '' } = attr
  if (staticClassExp || dynamicClassExp) {
    attr.__exps = [parseExp(staticClassExp), parseExp(dynamicClassExp)]

    delete attr.staticClassExp
    delete attr.dynamicClassExp
  } else {
    const exps = getAttrExps(attr)
    if (exps) {
      attr.__exps = [exps]
    }
  }
}

function processStyle(attr) {
  const { staticStyleExp = '', dynamicStyleExp = '' } = attr
  if (staticStyleExp || dynamicStyleExp) {
    attr.__exps = [parseExp(staticStyleExp), parseExp(dynamicStyleExp)]

    delete attr.staticStyleExp
    delete attr.dynamicStyleExp
  } else {
    const exps = getAttrExps(attr)
    if (exps) {
      attr.__exps = [exps]
    }
  }
}

function getAttrExps(attr) {
  const parsed = parseMustache(attr.value)
  if (parsed.hasBinding && !attr.__exps) {
    return parseExp(parsed.result)
  }
}

function processBindEvent(attr) {
  if (attr.eventConfigMap) {
    const exps = []
    for (const eventName in attr.eventConfigMap) {
      const configs = attr.eventConfigMap[eventName] || []
      const eventExp = {
        eventName,
        exps: []
      }

      configs.forEach(item => {
        eventExp.exps.push(parseExp(item))
      })

      exps.push(eventExp)
    }

    attr.__exps = exps

    delete attr.eventConfigMap
  }
}

function processText(vnode) {
  // text 节点
  if (vnode.type === 3) {
    // todo 全局 defs 静态数的处理? -> 目前已经都支持了
    const parsed = parseMustache(vnode.text)
    if (parsed.hasBinding) {
      vnode.__exps = parseExp(parsed.result)
      delete vnode.text
    }

    delete vnode.exps
  }
}

function processDirectives(vnode, config) {
  const directives = Object.values(config.directive)
  if (vnode.attrsMap) {
    Object.keys(vnode.attrsMap).forEach(item => {
      if (directives.includes(item)) {
        getAndRemoveAttr(vnode, item)
      }
    })
  }
}

function processChildren(vnode, config) {
  if (vnode.children && vnode.children.length) {
    vnode.children.forEach(item => {
      simplifyTemplate(item, config)
    })
  } else {
    delete vnode.children
  }
}

function postProcessIf(vnode) {
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

function deleteUselessAttrs(vnode) {
  const uselessAttrs = ['parent', 'exps', 'unary']
  uselessAttrs.forEach(function (attr) {
    delete vnode[attr]
  })
}

// function processWxs (vnode) {
//   if (vnode.tag === 'wxs') {
//     replaceNode(vnode, createASTElement('block', []))
//   }
// }

function minisizeAttr(v) {
  v.n = v.name
  v.__ep = v.__exps
  v.v = v.value
  delete v.name
  delete v.__exps
  delete v.value
}

function minisizeIfConditions(ifConditions) {
  ifConditions.ep = ifConditions.ifExp
  ifConditions.b = ifConditions.block
  ifConditions.__ep = ifConditions.__exps

  delete ifConditions.ifExp
  delete ifConditions.block
  delete ifConditions.__exps
}

function minisizeFor(forConditions) {
  forConditions.idx = forConditions.index
  forConditions.i = forConditions.item
  forConditions.k = forConditions.key
  forConditions.__exp = forConditions.__exps

  delete forConditions.index
  delete forConditions.item
  delete forConditions.key
  delete forConditions.__exps
}

function minisizeVnode(vnode) {
  vnode.t = vnode.tag
  vnode.ty = vnode.type
  vnode.c = vnode.children
  vnode.p = vnode.parent
  vnode.al = vnode.attrsList?.forEach(v => minisizeAttr(v))
  vnode.am = vnode.attrsMap
  vnode.ep = vnode.exps
  vnode.__ep = vnode.__exps
  vnode.d = vnode.dynamic
  vnode.at = vnode.aliasTag
  if (vnode.if) {
    vnode.ifc = vnode.ifConditions?.forEach(v => minisizeIfConditions(v))
  }
  if (vnode.for) {
    minisizeFor(vnode.for)
  }

  delete vnode.type
  delete vnode.tag
  delete vnode.children
  delete vnode.parent
  delete vnode.attrsList
  delete vnode.attrsMap
  delete vnode.exps
  delete vnode.__exps
  delete vnode.dynamic
  delete vnode.aliasTag
  delete vnode.ifConditions
}

function simplifyTemplate(vnode, config) {
  if (!vnode) {
    return
  }

  // todo
  // processWxs(vnode)
  processIf(vnode, config)
  processFor(vnode)
  processAttrsMap(vnode, config)
  processText(vnode)
  processChildren(vnode, config)
  postProcessIf(vnode)

  deleteUselessAttrs(vnode)

  if (vnode.tag === 'temp-node') {
    vnode.tag = 'block'
  }

  // minisizeVnode(vnode)
}

module.exports = function (vnode, mode) {
  const _vnode = Object.assign({}, vnode)
  const config = allConfigs[mode]
  simplifyTemplate(_vnode, config)
  return _vnode
}
