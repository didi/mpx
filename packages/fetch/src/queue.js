export default class RequestQueue {
  constructor (config) {
    if (!config.adapter) {
      console.error('please provide a request adapter ')
      return
    }
    this.adapter = config.adapter
    this.limit = config.limit || 10
    this.delay = config.delay || 0
    this.ratio = config.ratio || 0.3
    this.flushing = false
    this.isLock = false
    this.workList = []
    this.lowWorkList = []
    this.workingList = []
    this.lowPriorityWhiteList = []
  }

  addLowPriorityWhiteList (rules) {
    if (!Array.isArray(rules)) {
      rules = [rules]
    }
    for (let rule of rules) {
      this.lowPriorityWhiteList.indexOf(rule) === -1 && this.lowPriorityWhiteList.push(rule)
    }
  }

  checkInLowPriorityWhiteList (url) {
    return this.lowPriorityWhiteList.some(item => {
      return item === '*' || (item instanceof RegExp ? item.test(url) : url.indexOf(item) > -1)
    })
  }

  request (requestConfig, priority) {
    let proxy = null
    const promise = new Promise((resolve, reject) => {
      proxy = {
        resolve,
        reject
      }
    })
    if (!priority) {
      priority = this.checkInLowPriorityWhiteList(requestConfig.url) ? 'low' : 'normal'
    }
    const work = {
      request: requestConfig,
      priority,
      promise: proxy
    }
    this.addWorkQueue(work)
    this.flushQueue()
    return promise
  }

  addWorkQueue (work) {
    switch (work.priority) {
      case 'normal':
        this.workList.push(work)
        break
      case 'low':
        this.lowWorkList.push(work)
        break
      default:
        this.workList.push(work)
        break
    }
  }

  delWorkQueue (work) {
    let index = this.workingList.indexOf(work)
    if (index !== -1) {
      this.workingList.splice(index, 1)
    }
  }

  lock () {
    this.isLock = true
  }

  unlock () {
    this.isLock = false
    this.workingRequest()
  }

  flushQueue () {
    if (this.flushing) return
    this.flushing = true
    setTimeout(() => {
      this.workingRequest()
    }, this.delay)
  }

  workingRequest () {
    while (this.workingList.length < this.limit && this.workList.length) {
      if (this.isLock) break
      let work = this.workList.shift()
      this.workingList.push(work)
      this.run(work)
    }
    // 对低优先级请求总有所保留，为之后的正常请求提供一个buffer
    const buffer = parseInt((this.limit - this.workingList.length) * this.ratio, 10) || 1
    const limit = this.limit - buffer
    while (this.workingList.length < limit && this.lowWorkList.length) {
      if (this.isLock) break
      let work = this.lowWorkList.shift()
      this.workingList.push(work)
      this.run(work)
    }
    this.flushing = false
  }

  requestComplete (work) {
    this.delWorkQueue(work)
    this.flushQueue()
  }

  run (work) {
    this.adapter(work.request).then((res) => {
      work.promise.resolve(res)
      this.requestComplete(work)
    }, (err) => {
      work.promise.reject(err)
      this.requestComplete(work)
    })
  }
}
