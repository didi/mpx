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
   * 1. id 选择器：#the-id
   * 2. class 选择器（可以连续指定多个）：.a-class.another-class
   */
  select (selector = '', all) {
    if (!this._component) {
      warn('Please use SelectorQuery.in method to set context')
    }
    selector = selector.trim()
    // 后续如果要支持这种复杂的选择器，需要按场景拆分这些判断逻辑
    if (/>|,|>>>|\+|~|\s+/.test(selector)) {
      warn('SelectQuery.select don\'t support combinator selector, it only supports selector like #a or .a or .a.b now.')
      return new NodeRef([], this, !all)
    }
    const refs = this._component && this._component.__selectRef(selector, 'node', all)
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
