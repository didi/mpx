import { nodeOps } from './element'
import { cache } from './utils'
import { diffVnode } from '../helper/utils'

export default function patch (oldVnode, vnode, context) {
  let diffPath = {}
  if (!context.nodeIds) {
    context.nodeIds = new Set()
  }
  // 初次创建的流程需优化
  if (!oldVnode) {
    createElm(vnode, undefined, context)
  } else {
    diffPath = patchVnode(oldVnode, vnode, diffPath)
  }

  return diffPath
}

function patchVnode (oldVnode, vnode) {
  const { diffData } = diffVnode(vnode, oldVnode)
  return diffData
}

// function patchVnode (oldVnode, vnode) {
//   const curPath = oldVnode.elm._path
//   if (oldVnode.nodeType !== vnode.nodeType) {
//     diffPath[curPath] = vnode
//     replaceVnode(oldVnode, vnode, context)
//     return
//   }
//   const oldVnodeData = oldVnode.data
//   const vnodeData = vnode.data
//   if (vnodeData) {
//     for (let key in vnodeData) {
//       patchData(oldVnode, key, oldVnodeData[key], vnodeData[key])
//     }
//   }

//   if (oldVnodeData) {
//     for (let key in oldVnodeData) {
//       const oldData = oldVnodeData[key]
//       if (oldData && !vnodeData.hasOwnProperty(key)) {
//         patchData(oldVnode, key, oldVnodeData[key], null)
//       }
//     }
//   }

//   patchChildren(oldVnode, vnode, diffPath)
// }

// function replaceVnode (oldVnode, vnode, diffPath) {
//   if (oldVnode.parent) {
//     oldVnode.parent.children = [vnode]
//     // console.log('the oldVnode path is:', oldVnode._path)
//   }
// }

// function patchData (vnode, key, oldValue, newValue) {
//   const basePath = vnode.elm._path
//   const data = diffVnode(newValue, oldValue) // 获取 diff 的数据，但是不能获取新增
//   // TODO: do patchData and collect diff path
//   switch (key) {
//     case 'style':
//       for (let key in newValue) {
//         vnode.style[key] = newValue[key]
//       }
//       for (let key in oldValue) {
//         if (!newValue.hasOwnProperty(key)) {
//           vnode.style[key] = ''
//         }
//       }
//       break
//     case 'class':
//       break
//     case 'mpxbindevent':
//       break
//     case 'eventconfigs':
//       break
//     default:
//       break
//   }
// }

// function patchChildren (oldVnode, vnode, diffPath) {
//   const oldCh = oldVnode.children
//   const ch = vnode.children

//   const oldChPath = oldVnode.elm._path
//   if (oldCh.length === 0) {
//     if (ch.length === 0) {
//       // do nothing
//     } else {
//       for (let i = 0; i < ch.length; i++) {
//         const key = oldChPath + `.children[${i}]`
//         diffPath[key] = ch[i]
//       }
//     }
//   } else if (oldCh.length === 1) {
//     if (ch.length === 0) {
//       const key = oldChPath + '.children'
//       diffPath[key] = []
//     } else if (ch.length === 1) {
//       patchVnode(oldCh[0], ch[0], diffPath)
//     } else {
//       for (let i = 0; i < ch.length; i++) {
//         const key = oldChPath + `.children[${i}]`
//         diffPath[key] = ch[i]
//       }
//     }
//   } else {
//     if (ch.length === 0) {
//       const key = oldChPath + '.children'
//       diffPath[key] = []
//     } else if (ch.length === 1) {
//       const key = oldChPath + '.children[0]'
//       diffPath[key] = ch[0]
//     } else {
//       if (ch.length >= oldCh.length) {
//         for (let i = 0; i < ch.length; i++) {
//           const key = oldChPath + `.children[${i}]`
//           diffPath[key] = ch[i]
//         }
//       } else {
//         diffPath[oldChPath] = ch
//       }
//     }
//   }
// }

// function bindContext () {

// }

// 绑定上下文、建立父子节点的联系
function createElm (vnode, parentElm, context) {
  // const data = vnode.data || {}
  if (vnode.nodeId) {
    context.nodeIds.add(vnode.nodeId)
  }
  // const context = vnode.context
  const tag = vnode.nodeType
  const children = vnode.children

  if (tag) {
    // vnode.elm = nodeOps.createElement(tag, data, children, undefined, undefined, context)
    createChildren(vnode, children, context)
    insert(parentElm, vnode.elm)
  } else if (vnode.text) {
    // vnode.elm = nodeOps.createTextNode(vnode.text)
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
