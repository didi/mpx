import cssSelect from './css-select'
// todo: stringify wxs 模块只能放到逻辑层执行，主要还是因为生成 vdom tree 需要根据 class 去做匹配，需要看下这个代码从哪引入
import stringify from '../../../webpack-plugin/lib/runtime/stringify.wxs'
import Interpreter from './interpreter'
import staticMap from './staticMap'

export default function _genVnodeTree (vnodeAst, contextScope, cssList) {
  // 引用的 vnodeAst 浅复制，解除引用
  vnodeAst = cloneNode(vnodeAst)
  // 获取实例 uid
  const uid = contextScope[0]?.__mpxProxy?.uid || contextScope[0]?.uid
  // slots 通过上下文传递，相当于 props
  const slots = contextScope[0]?.$slots || {}
  const slotName = contextScope[0]?.slot
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
  }

  function createEmptyNode () {
    return _c('block')
  }

  function genVnodeTree (node) {
    if (node.type === 1) {
      // wxs 模块不需要动态渲染
      if (node.tag === 'wxs') {
        return createEmptyNode()
      } else if (node.for && !node.forProcessed) {
        return genFor(node)
      } else if (node.if && !node.ifProcessed) {
        return genIf(node)
      } else if (node.tag === 'slot') {
        return genSlot(node)
      } else {
        const data = genData(node)
        const children = genChildren(node)
        if (node.dynamic) {
          return _cd(node.aliasTag, data, children)
        } else {
          return _c(node.aliasTag || node.tag, data, children)
        }
      }
    } else if (node.type === 3) {
      return genText(node)
    }
  }

  function evalExps (exps) {
    const interpreter = new Interpreter(contextScope)
    // 消除引用关系
    let value
    try {
      value = interpreter.eval(JSON.parse(JSON.stringify(exps)))
    } catch (e) {
      console.warn(e)
    }
    return value
  }

  function _c (tag, data = {}, children = []) {
    if (Array.isArray(data)) {
      children = data
      data = {}
    }
    if (typeof tag === 'object') {
      return tag
    }

    // 处理 for 循环产生的数组，同时清除空节点
    children = simpleNormalizeChildren(children).filter(node => !!node?.nodeType)

    return {
      // tagName: tag,
      nodeType: tag,
      data,
      children
    }
  }

  function _cd(moduleId, data = {}, children = []) {
    console.log('the staticMap and moduleId is:', staticMap, moduleId)
    const { template = {}, styles = [] } = staticMap[moduleId]
    data.$slots = resolveSlot(children) // 将 slot 通过上下文传递到子组件的渲染流程中
    const vnodeTree = _genVnodeTree(template, [data], styles)
    return vnodeTree
  }

  function resolveSlot(children) {
    const slots = {}
    if (children.length) {
      for (let i = 0; i < children.length; i++) {
        const child = children[i]
        const name = child.data?.slot
        if (name) {
          const slot = (slots[name] || (slots[name] = []))
          if (child.tag === 'template') {
            slot.push.apply(slot, child.children || [])
          } else {
            slot.push(child)
          }
        } else {
          (slots.default || (slots.default = [])).push(child)
        }
      }
    }
    return slots
  }

  function genData (node) {
    if (!node.attrsList) {
      return {}
    }

    const res = {
      uid
    }
    node.attrsList.forEach((attr) => {
      if (attr.name === 'class' || attr.name === 'style') {
        // class/style 的表达式为数组形式，class/style的计算过程需要放到逻辑层，主要是因为有逻辑匹配的过程去生成 vnodeTree
        const helper = attr.name === 'class' ? stringify.stringifyClass : stringify.stringifyStyle
        let value = ''
        if (attr.__exps) {
          const valueArr = attr.__exps.reduce((preVal, curExpression) => {
            preVal.push(evalExps(curExpression))
            return preVal
          }, [])
          value = helper(...valueArr)
        } else {
          value = attr.value
        }
        res[attr.name] = value
      } else if (attr.name === 'data-eventconfigs') {
        const eventMap = {}
        attr.__exps?.forEach(({ eventName, exps }) => {
          eventMap[eventName] = exps.map(exp => evalExps(exp))
        })
        res.dataEventconfigs = eventMap
      } else {
        res[attr.name] = attr.__exps
          ? evalExps(attr.__exps)
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
      content: node.__exps ? evalExps(node.__exps) : node.text
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

    const forValue = evalExps(forExp.__exps)
    if (Array.isArray(forValue)) {
      forValue.forEach((item, index) => {
        // item、index 模板当中如果没申明，需要给到默认值
        scope[itemKey] = item
        scope[indexKey] = index

        contextScope.push(scope)

        // 针对 for 循环避免每次都操作的同一个 node 导致数据的污染的问题
        res.push(genVnodeTree(cloneNode(node)))

        contextScope.pop()
      })
    }

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
      const identifierValue = evalExps(condition.__exps)
      if (identifierValue) {
        res = genVnodeTree(condition.block === 'self' ? node : condition.block)
        break
      }
    }
    return res
  }

  // 暂时不支持作用域插槽
  function genSlot (node) {
    const data = genData(node) // 计算属性值
    const slotName = data.name || 'default'
    return slots[slotName] || createEmptyNode()
  }

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

  const interpreteredVnodeTree = genVnodeTree(vnodeAst)
  if (slotName) {
    interpreteredVnodeTree.data.slot = slotName
  }
  return genVnodeWithStaticCss(interpreteredVnodeTree)
}
