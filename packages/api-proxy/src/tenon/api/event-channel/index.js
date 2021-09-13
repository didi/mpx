class EventChannel {
  constructor () {
    this.listener = {}
  }
  emit (eventName, ...args) {
    const cbs = this.listener[eventName]
    if (cbs) {
      cbs.map((item, index) => {
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
  off (eventName, EventCallback) {
    if (EventCallback) {
      const cbs = this.listener[eventName]
      const copyCbs = []
      if (cbs) {
        cbs.map((item, index) => {
          if (item.fn !== EventCallback) {
            copyCbs.push(item)
          }
        })
      }
      this.listener[eventName] = copyCbs
    } else {
      this.listener[eventName] && (this.listener[eventName].length = 0)
    }
  }
  on (eventName, EventCallback) {
    (this.listener[eventName] || (this.listener[eventName] = [])).push({ fn: EventCallback, type: 'on' })
  }
  once (eventName, EventCallback) {
    (this.listener[eventName] || (this.listener[eventName] = [])).push({ fn: EventCallback, type: 'once' })
  }
  _addListener (eventName, EventCallback, type) {
    (this.listener[eventName] || (this.listener[eventName] = [])).push({ fn: EventCallback, type })
  }
  _addListeners (events) {
    if (Object.prototype.toString.call(events) === '[object Object]') {
      Object.keys(events).map((eventName) => {
        (this.listener[eventName] || (this.listener[eventName] = [])).push({ fn: events[eventName], type: 'on' })
      })
    }
  }
}
export {
  EventChannel
}
