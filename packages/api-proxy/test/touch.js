// jest 没有 Touch，支持一下
class Touch {
  constructor (params) {
    const { identifier, target, clientX, clientY } = params
    this.identifier = identifier
    this.target = target
    this.clientX = clientX
    this.clientY = clientY
    this.pageX = clientX
    this.pageY = clientY
  }
}

export const createTouchEvent = (type, target, params = {}) => {
  const { clientX = 0, clientY = 0 } = params
  const touch = new Touch({ identifier: Date.now(), target, clientX, clientY })
  const event = new TouchEvent(type, {
    cancelable: true,
    bubbles: true,
    touches: [touch],
    targetTouches: [touch],
    changedTouches: [touch]
  })
  return event
}

export const dispatchTap = (el) => {
  el.dispatchEvent(createTouchEvent('tap', el))
}
