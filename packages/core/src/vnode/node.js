export default class VNode {
  constructor (tag, data = {}, children, text, elm, context) {
    this.nodeType = tag || ''
    this.tag = tag
    this.data = data
    this.id = data.nodeId
    this.children = children
    this.text = text
    this.elm = elm
    this.ns = undefined
    this.context = context
    this.parent = undefined
    this.isStatic = false
    this.isComment = false
  }

  // 节点路径
  get _path () {
    const pathStack = []
    let parent = this.parent
    while (parent) {
      const index = parent.children.indexOf(this)
      pathStack.unshift('children', index)
      parent = parent.parent
    }
    return pathStack
  }
}

export const createEmptyVNode = (text = '') => {
  const node = new VNode()
  node.text = text
  node.isComment = true
  return node
}

export function createTextVNode (val = '') {
  return new VNode(undefined, undefined, undefined, undefined, String(val))
}
