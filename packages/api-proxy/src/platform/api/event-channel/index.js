class EventChannel {
  constructor () {
    this.listener = {}
  }

  emit (eventName, ...args) {
    const cbs = this.listener[eventName]
    if (cbs) {
      cbs.forEach((item, index) => {
        try {
          item.fn.apply(this, args)
        } catch (e) {
          console.log(`event "${eventName}" error ${e}`)
        }
        if (item.type === 'once') {
          cbs.splice(index, 1)
        }
      })
    }
  }

  off (eventName, listener) {
    if (listener) {
      const cbs = this.listener[eventName]
      const copyCbs = []
      if (cbs) {
        cbs.forEach((item) => {
          if (item.fn !== listener) {
            copyCbs.push(item)
          }
        })
      }
      this.listener[eventName] = copyCbs
    } else {
      this.listener[eventName] && (this.listener[eventName].length = 0)
    }
  }

  on (eventName, listener) {
    this._addListener(eventName, listener, 'on')
  }

  once (eventName, listener) {
    this._addListener(eventName, listener, 'once')
  }

  _addListener (eventName, listener, type) {
    const entry = { fn: listener, type }
    ;(this.listener[eventName] || (this.listener[eventName] = [])).push(entry)
    return entry
  }

  _addListeners (events) {
    const added = Object.keys(events).map(eventName => [eventName, this._addListener(eventName, events[eventName], 'on')])
    return () => {
      added.forEach(([eventName, entry]) => {
        const listeners = this.listener[eventName]
        const index = listeners ? listeners.indexOf(entry) : -1
        if (index >= 0) listeners.splice(index, 1)
      })
    }
  }
}

export {
  EventChannel
}
