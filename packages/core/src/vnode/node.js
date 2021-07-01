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

  // 获取树节点路径
  get _path () {
    const pathStack = []
    let parent = this.parentNode
    let child = this
    while (parent) {
      const index = parent.childNodes.indexOf(child)
      pathStack.unshift('children', index)
      child = parent
      parent = parent.parentNode
    }
    const pathStr = pathStack.reduce((preVal, curVal, curIndex) => {
      if (typeof curVal === 'number') {
        curVal = `[${curVal}]`
        if (curIndex !== pathStack.length - 1) {
          curVal = curVal + '.'
        }
      }
      return preVal + curVal
    }, 'r.')
    return pathStr
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
