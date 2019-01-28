export default class Queue {
  constructor () {
    this.init()
  }

  init () {
    this.stack = []
    this.top = null
  }

  enter (depth, id) {
    // 栈顶
    this.top = {
      depth,
      id
    }
  }

  exit (depth, id, fn) {
    this.stack.push({
      cb: fn,
      id,
      depth
    })
    // 最后一个开始退出
    if (id === this.top.id) {
      this.run()
    }
  }

  run () {
    this.stack.sort((a, b) => {
      if (a.depth === b.depth) {
        // 兄弟组件id越小越先执行
        return a.id - b.id
      } else {
        // 组件层级越深，就越先执行
        return b.depth - a.depth
      }
    })
    this.stack.forEach(item => {
      typeof item.cb === 'function' && item.cb()
    })
    this.init()
  }
}

export const mountedQueue = new Queue()
