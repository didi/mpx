function addEvent (el, type, handler, capture) {
  el.addEventListener(type, handler, {
    passive: false,
    capture: !!capture
  })
}

function removeEvent (el, type, handler, capture) {
  el.removeEventListener(type, handler, {
    capture: !!capture
  })
}

export default class EventRegister {
  constructor (wrapper, events) {
    this.wrapper = wrapper
    this.events = events
    this.addDOMEvents()
  }

  addDOMEvents (el, type, handler) {
    this.handleDOMEvents(addEvent)
  }

  removeDOMEvents () {
    this.handleDOMEvents(removeEvent)
  }

  handleDOMEvents (eventOperation) {
    const wrapper = this.wrapper
    this.events.forEach(event => {
      eventOperation(wrapper, event.name, event.handler, !!event.capture)
    })
  }

  destroy () {
    this.removeDOMEvents()
    this.events = []
  }
}
