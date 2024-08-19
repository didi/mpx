import NodeRef from './rnNodesRef'
import { warn, noop } from '@mpxjs/utils'

export default class SelectorQuery {
  constructor () {
    this._component = null
    this._queue = []
    this._queueCb = []
  }

  // wx 目前 exec 方法返回 undefined，文档上标注的是 NodeRef 类型，按实际的返回值来实现
  exec (cb = noop) {
    Promise.all(this._queueCb.map((cb) => cb())).then((res) => cb(res))
  }

  in (component) {
    this._component = component
    return this
  }

  /**
   * 目前支持的 selector
   * 
   * 1. #id
   * 2. .class
   * 3. .class1.class2
   */
  // todo 元素选择规则：只支持单 selector 选择器：#id，.class
  select (selector = '', all) {
    // todo class/id
    if (!this._component) {
      warn('Please use SelectorQuery.in method to set context')
    }
    const splitedSelector = selector.match(/(#|\.)\w+/g)
    // todo match 工作
    const refs =
      this._component && this._component.__selectRef(selector, 'node', all)
    return new NodeRef(refs, this, !all)
  }

  selectAll (selector) {
    return this.select(selector, true)
  }

  selectViewport () {
    // todo rn 这块实现不了
    return this.select('')
  }
}
