import VNode from './node'

export const nodeOps = {
  createElement(tag, data, children, text, elm, context) {
    return new Element(tag, data, children, text, elm, context)
  },
  createTextNode(text) {
    return new Element(undefined, undefined, undefined, text)
  },
  createComment() {
    return new Element()
  },
  appendChild(node, child) {
    node.appendChild(child)
  }
}

export default class Element extends VNode {
  constructor(...args) {
    super(...args)

    this.childNodes = []
    this.parentNode = null
  }

  appendChild(node) {
    this.childNodes.push(node)
    node.parentNode = this
  }
}