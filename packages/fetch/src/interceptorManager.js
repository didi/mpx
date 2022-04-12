import { isThenable } from './util'

export default class InterceptorManager {
  constructor () {
    this.interceptors = []
  }

  use (fulfilled, rejected) {
    const wrappedFulfilled = (result) => {
      const returned = fulfilled(result)
      return returned === undefined ? result : returned
    }
    const wrappedRejected = (reason) => {
      const returned = rejected(reason)
      reason = returned === undefined ? reason : returned
      return isThenable(reason) ? reason : Promise.reject(reason)
    }
    const interceptor = {
      fulfilled: wrappedFulfilled,
      rejected: wrappedRejected
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
