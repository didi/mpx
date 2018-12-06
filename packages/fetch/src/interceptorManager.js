export default class InterceptorManager {
  constructor () {
    this.interceptors = []
  }

  use (fulfilled, rejected) {
    const interceptor = {
      fulfilled,
      rejected
    }
    this.interceptors.push(interceptor)
    return function remove () {
      const index = this.interceptors.indexOf(interceptor)
      index > -1 && this.interceptors.splice(index, 1)
    }
  }

  forEach (fn) {
    this.interceptors.forEach(interceptor => fn(interceptor))
  }
}
