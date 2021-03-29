import Element, { nodeOps } from './element'
import { cache } from './utils'

export default function patch (oldVnode, vnode) {
  createElm(vnode)
  return vnode.elm
}

function createElm(vnode, parentElm) {
  const data = vnode.data
  const tag = vnode.nodeType
  const children = vnode.children
  
  if (tag) {
    vnode.elm = nodeOps.createElement(tag, data, children)
    createChildren(vnode, children)
    insert(parentElm, vnode.elm)
  } else if (vnode.text) {
    vnode.elm = nodeOps.createTextNode(vnode.text)
    insert(parentElm, vnode.elm)
  } else if (vnode.isComment) {
    // do something
  }
  
  cache.setNode(vnode.nodeId, vnode.elm)
}

function createChildren(vnode, children) {
  if (Array.isArray(children)) {
    for (let i = 0; i < children.length; i++) {
      createElm(children[i], vnode.elm)
    }
  } else if (children.text) {
    nodeOps.appendChild(vnode.elm, nodeOps.createTextNode(String(vnode.text)))
  }
}

function insert(parentElm, elm) {
  if (parentElm && elm) {
    nodeOps.appendChild(parentElm, elm)
  }
}