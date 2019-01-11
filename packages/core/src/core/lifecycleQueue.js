export default class Queue {
  constructor () {
    this.init()
  }

  init () {
    this.stack = []
    this.top = null
  }

  enter (id) {
    // 栈顶id
    this.top = id
  }

  exit (id, fn) {
    this.stack.push({
      cb: fn,
      id
    })
    // 最后一个开始退出
    if (id === this.top) {
      this.run()
    }
  }

  run () {
    this.stack.sort((a, b) => {
      return b.id - a.id
    })
    this.stack.forEach(item => {
      typeof item.cb === 'function' && item.cb()
    })
    this.init()
  }
}

export const mountedQueue = new Queue()
