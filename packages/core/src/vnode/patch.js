import { nodeOps } from './element'
import { cache } from './utils'

// TODO: patch 流程下期优化
export default function patch (oldVnode, vnode, context) {
  if (!context.nodeIds) {
    context.nodeIds = new Set()
  }
  createElm(vnode, undefined, context)
  return vnode.elm
}

function createElm (vnode, parentElm, context) {
  const data = vnode._data || {}
  if (vnode.nodeId) {
    context.nodeIds.add(vnode.nodeId)
  }
  // const context = vnode.context
  const tag = vnode.nodeType
  const children = vnode.children

  if (tag) {
    vnode.elm = nodeOps.createElement(tag, data, children, undefined, undefined, context)
    createChildren(vnode, children, context)
    insert(parentElm, vnode.elm)
  } else if (vnode.text) {
    vnode.elm = nodeOps.createTextNode(vnode.text)
    insert(parentElm, vnode.elm)
  } else if (vnode.isComment) {
    // do something
  }

  cache.setNode(vnode.nodeId, vnode.elm)
  return vnode.elm
}

function createChildren (vnode, children, context) {
  if (Array.isArray(children)) {
    for (let i = 0; i < children.length; i++) {
      createElm(children[i], vnode.elm, context)
    }
  } else if (children.text) {
    nodeOps.appendChild(vnode.elm, nodeOps.createTextNode(String(vnode.text)))
  }
}

function insert (parentElm, elm) {
  if (parentElm && elm) {
    nodeOps.appendChild(parentElm, elm)
  }
}
