class NodesRef {
  constructor (selector, selectorQuery, single) {
    this._selector = selector
    this._selectorQuery = selectorQuery
    this._component = selectorQuery._component
    this._single = single
  }

  boundingClientRect (callback) {
    this._selectorQuery._push(
      this._selector,
      this._component,
      this._single,
      {
        id: true,
        dataset: true,
        rect: true,
        size: true
      },
      callback
    )
    return this._selectorQuery
  }

  scrollOffset (callback) {
    this._selectorQuery._push(
      this._selector,
      this._component,
      this._single,
      {
        id: true,
        dataset: true,
        scrollOffset: true
      },
      callback
    )
    return this._selectorQuery
  }

  fields (fields, callback) {
    this._selectorQuery._push(
      this._selector,
      this._component,
      this._single,
      fields,
      callback
    )
    return this._selectorQuery
  }

  // 获取Node节点实例
  node (callback) {
    this._selectorQuery._push(
      this._selector,
      this._component,
      this._single,
      {
        node: true
      },
      callback
    )
    return this._selectorQuery
  }
}

export default NodesRef
