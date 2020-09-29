function addEvent (el, type, handler) {
  el.addEventListener(type, handler, { passive: false })
}

function removeEvent (el, type, handler) {
  el.removeEventListener(type, handler, { passive: false })
}

export default class EventRegister {
  constructor () {
    this.disposer = []
  }

  on (el, type, handler) {
    this.disposer.push([el, type, handler])
    addEvent(el, type, handler)
  }

  destroy () {
    this.disposer.forEach(args => {
      removeEvent(args[0], args[1], args[2])
    })
    this.disposer = []
  }
}
