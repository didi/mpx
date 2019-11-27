class EventChannel {
  _events = new Map()
  on (event, fn) {
    const events = this._events
    if (!events.has(event)) {
      events.set(event, new Set())
    }
    if (!events.get(event).has(fn)) {
      events.get(event).add(fn)
    }
    return this
  }
  off (event, fn) {
    if (!arguments.length) {
      this._events = new Map()
      return this
    }
    const cbs = this._events.get(event)
    if (!cbs) { return this }
    if (!fn) {
      this._events.delete(event)
    } else {
      for (let cb of cbs) {
        if (cb === fn || cb.fn === fn) {
          cbs.delete(cb)
          break
        }
      }
    }
    return this
  }
  emit (event, ...args) {
    const cbs = this._events.get(event)
    if (cbs) {
      cbs.forEach(cb => {
        try {
          cb.apply(this, args)
        } catch (e) {
          console.log(`event "${event}" error ${e}`)
        }
      })
    }
  }
  once (event, fn) {
    const _this = this
    function onceCb () {
      _this.off(event, onceCb)
      fn.apply(_this, arguments)
    }
    onceCb.fn = fn
    this.on(event, onceCb)
    return this
  }
}

export {
  EventChannel
}
