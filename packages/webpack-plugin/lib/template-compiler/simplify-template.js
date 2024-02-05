const { getAndRemoveAttr, parseMustache, findPrevNode, removeNode } = require('./compiler')
const allConfigs = require('../config')
const parseExps = require('./parse-exps')

function processIf (vnode, config) {
  delete vnode.ifProcessed
  // todo elif 相关的处理
  // if (vnode.if) {
  //   delete vnode.if
  // }

  if (vnode.if) {
    getAndRemoveAttr(vnode, config.directive.if)
    const parsedExp = vnode.if.exp
    addIfCondition(vnode, {
      exp: parsedExp,
      block: 'self',
      __exps: parseExps(parsedExp)
    })
  } else if (vnode.elseif || vnode.else) {
    const directive = vnode.elseif ? config.directive.elseif : config.directive.else
    getAndRemoveAttr(vnode, directive)
    processIfConditions(vnode)
  } else if (typeof vnode._if === 'boolean') {
    addIfCondition(vnode, {
      exp: `'${vnode._if}'`,
      block: 'self',
      __exps: parseExps(`'${vnode._if}'`)
    })
  }

  // 消除 if 指令建立的父子间的关系
  if (vnode.ifConditions) {
    vnode.ifConditions.forEach(({ item }) => {
      simplifyTemplate(item, config)
    })
  }
}

function addIfCondition (el, condition) {
  if (!el.ifConditions) {
    el.ifConditions = []
  }
  el.ifConditions.push(condition)
}

function processIfConditions (el) {
  const prev = findPrevNode(el)
  if (prev && (prev.if || prev._if)) {
    addIfCondition(prev, {
      exp: el.elseif ? el.elseif.exp : '',
      block: el,
      __exps: el.elseif ? parseExps(el.elseif.exp) : ''
    })
  }
  removeNode(el)
}

function processFor (vnode) {
  if (vnode.for) {
    vnode.for.__exps = parseExps(vnode.for.exp)

    delete vnode.for.raw
    delete vnode.for.exp
  }
}

function processAttrsMap (vnode, config) {
  processDirectives(vnode, config)

  vnode.attrsList && vnode.attrsList.forEach((attr) => {
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

  delete vnode.attrsMap
}

function processClass (attr) {
  const { staticClassExp = '', dynamicClassExp = '' } = attr
  if (staticClassExp || dynamicClassExp) {
    attr.__exps = [parseExps(staticClassExp), parseExps(dynamicClassExp)]

    delete attr.staticClassExp
    delete attr.dynamicClassExp
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
    attr.__exps = [parseExps(staticStyleExp), parseExps(dynamicStyleExp)]

    delete attr.staticStyleExp
    delete attr.dynamicStyleExp
  } else {
    const exps = getAttrExps(attr)
    if (exps) {
      attr.__exps = [exps]
    }
  }
}

function getAttrExps (attr) {
  const parsed = parseMustache(attr.value)
  if (parsed.hasBinding && !attr.__exps) {
    return parseExps(parsed.result)
  }
}

function processBindEvent (attr) {
  if (attr.eventConfigMap) {
    const exps = []
    for (const eventName in attr.eventConfigMap) {
      const configs = attr.eventConfigMap[eventName] || []
      const eventExp = {
        eventName,
        exps: []
      }

      configs.forEach((item) => {
        eventExp.exps.push(parseExps(item))
      })

      exps.push(eventExp)
    }

    attr.__exps = exps

    delete attr.eventConfigMap
  }
}

function processText (vnode) {
  // text 节点
  if (vnode.type === 3) {
    // todo 全局 defs 静态数的处理?
    const parsed = parseMustache(vnode.text)
    if (parsed.hasBinding) {
      vnode.__exps = parseExps(parsed.result)
    }

    delete vnode.exps
  }
}

function processDirectives (vnode, config) {
  const directives = Object.values(config.directive)
  if (vnode.attrsMap) {
    Object.keys(vnode.attrsMap).forEach(item => {
      if (directives.includes(item)) {
        getAndRemoveAttr(vnode, item)
      }
    })
  }
}

function processChildren (vnode, config) {
  if (vnode.children) {
    vnode.children.forEach(item => {
      simplifyTemplate(item, config)
    })
  }
}

function simplifyTemplate (vnode, config) {
  if (!vnode) {
    return
  }

  processIf(vnode, config)
  processFor(vnode)
  processAttrsMap(vnode, config)
  processText(vnode)
  processChildren(vnode, config)

  delete vnode.parent

  if (vnode.tag === 'temp-node') {
    vnode.tag = 'block'
  }
}

module.exports = function (vnode, mode) {
  const _vnode = Object.assign({}, vnode)
  const config = allConfigs[mode]
  simplifyTemplate(_vnode, config)

  return _vnode
}
