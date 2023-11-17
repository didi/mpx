const notifyCenter = Hummer.notifyCenter
const { Memory } = __GLOBAL__
// 通过Memory 和 notifyCenter实现跨页面事件通道
// FIXME:可能存在的问题once订阅的移除   emit事件传参数量
class EventChannel {
  emit (eventName, ...args) {
    notifyCenter.triggerEvent(eventName, args)
    if (Memory.exist(`_ENENT_ONCE_${eventName}`)) {
      // 订阅和发送可能不是一个上下文 暂时只能全部移除
      this.off(eventName)
      Memory.remove(`_ENENT_ONCE_${eventName}`)
    }
  }

  off (eventName, EventCallback) {
    notifyCenter.removeEventListener(eventName, EventCallback)
  }

  on (eventName, EventCallback) {
    notifyCenter.addEventListener(eventName, EventCallback)
  }

  once (eventName, EventCallback) {
    notifyCenter.addEventListener(eventName, EventCallback)
    Memory.set(`_ENENT_ONCE_${eventName}`, 1)
  }

  _addListener (eventName, EventCallback, type) {
    switch (type) {
      case 'on':
        this.on(eventName, EventCallback)
        break
      case 'once':
        this.once(eventName, EventCallback)
        break
      default:
        this.on(eventName, EventCallback)
        break
    }
  }

  _addListeners (events) {
    if (Object.prototype.toString.call(events) === '[object Object]') {
      Object.keys(events).forEach((eventName) => {
        this.on(eventName, events[eventName])
      })
    }
  }
}
export {
  EventChannel
}
