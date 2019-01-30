export default class Queue {
  constructor () {
    this.init()
  }

  init () {
    this.stack = []
    this.stackNum = 0
  }

  enter (depth, id) {
    this.stackNum++
  }

  exit (depth, id, fn) {
    this.stack.push({
      cb: fn,
      id,
      depth
    })
    this.stackNum--
    // 最后一个开始退出
    if (this.stackNum === 0) {
      console.log(JSON.stringify(this.stack))
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
    let item
    while (item = this.stack.shift()) {
      typeof item.cb === 'function' && item.cb()
    }
  }
}

export const mountedQueue = new Queue()
