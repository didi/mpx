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
    const splitedSelector = selector.match(/(#|\.)\w+/g) || []
    const refsArr = splitedSelector.map(selector => this._component && this._component.__selectRef(selector, 'node', true))
    const refs = refsArr.reduce((preRefs, curRefs, curIndex) => {
      if (curIndex === 0) return curRefs
      return preRefs.filter(p => {
        const preNodeRef = p.getNodeInstance && p.getNodeInstance().nodeRef
        return curRefs.find(r => r.getNodeInstance && r.getNodeInstance().nodeRef === preNodeRef)
      })
    }, [])
    return new NodeRef(all ? refs : refs[0], this, !all)
  }

  selectAll (selector) {
    return this.select(selector, true)
  }

  selectViewport () {
    // todo rn 这块实现不了
    return this.select('')
  }
}
