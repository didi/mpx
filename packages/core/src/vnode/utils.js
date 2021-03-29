const nodeCache = {}

export const cache = {
  setNode(id, node) {
    if (id) {
      nodeCache[id] = node
    }
  },
  getNode(id) {
    return nodeCache[id]
  }
}

export function addParentRef(vnode, parent) {
  if (vnode.nodeId) {
    cache.setNode(vnode.nodeId, vnode)
  }
  if (parent) {
    vnode.parentNode = parent
  }
  if (vnode.children) {
    vnode.children.forEach(item => {
      addParentRef(item, vnode)
    })
  }

  return vnode
}