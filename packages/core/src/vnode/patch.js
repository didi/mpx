import { nodeOps } from './element'
import { cache } from './utils'
import { isDef } from '../helper/utils'

// TODO: patch 流程下期优化
export default function patch (oldVnode, vnode, context) {
  let diffPath = {}
  if (!context.nodeIds) {
    context.nodeIds = new Set()
  }
  // 初次创建的流程需优化
  if (oldVnode === vnode) {
    createElm(oldVnode, undefined, context)
    // return vnode.elm
  } else {
    patchVnode(oldVnode, vnode, diffPath)
  }

  return diffPath
}

function patchVnode (oldVnode, vnode, diffPath) {
  if (oldVnode.nodeType !== vnode.nodeType) {
    diffPath[oldVnode.elm._path] = vnode
    replaceVnode(oldVnode, vnode, context)
    return
  }

  const oldVnodeData = oldVnode.data
  const vnodeData = vnode.data

  if (vnodeData) {
    for (let key in vnodeData) {
      patchData(oldVnode, key, oldVnodeData[key], vnodeData[key])
    }
  }

  if (oldVnodeData) {
    for (let key in oldVnodeData) {
      const oldData = oldVnodeData[key]
      if (oldData && !vnodeData.hasOwnProperty(key)) {
        patchData(oldVnode, key, oldVnodeData[key], null)
      }
    }
  }

  patchChildren(oldVnode, vnode, diffPath)
}

function replaceVnode (oldVnode, vnode, diffPath) {
  if (oldVnode.parent) {
    oldVnode.parent.children = [vnode]
    // console.log('the oldVnode path is:', oldVnode._path)
  }
}

function patchData (vnode, key, oldValue, value) {
  // TODO: do patchData and collect diff path
}

function patchChildren (oldVnode, vnode, diffPath) {
  const oldCh = oldVnode.children
  const ch = vnode.children
  // TODO: 待完善
  if (oldCh.length === 0) {
    if (ch.length === 0) {

    } else if (ch.length === 1) {

    } else {

    }
  } else if (oldCh.length === 1) {
    if (ch.length === 0) {
    } else if (ch.length === 1) {
      patchVnode(oldCh[0], ch[0], diffPath)
    } else {
    }
  } else {
    if (ch.length === 0) {
    } else if (ch.length === 1) {
    } else {
    }
  }
}

function sameVnode (oldVnode, vnode) {

}

// 绑定上下文、建立父子节点的联系
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
