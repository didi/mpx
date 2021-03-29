import EventTarget from '../event/event-target'

export default class VNode extends EventTarget {
  constructor(tag, data, children, text, elm, context) {
    super()

    this.nodeType = tag || ''
    this.tag = tag
    this.data = data
    this.children = children
    this.text = text
    this.elm = elm
    this.ns = undefined
    this.context = context
    this.parent = undefined
    this.isStatic = false
    this.isComment = false
  }
}

export const createEmptyVNode = (text = '') => {
  const node = new VNode()
  node.text = text
  node.isComment = true
  return node
}

export function createTextVNode(val = '') {
  return new VNode(undefined, undefined, undefined, String(val))
}