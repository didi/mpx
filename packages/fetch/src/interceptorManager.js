import { isThenable } from './util'

export default class InterceptorManager {
  constructor () {
    this.interceptors = []
  }

  use (fulfilled, rejected) {
    const wrappedFulfilled = (result) => {
      const returnedResult = fulfilled(result)
      if (returnedResult === undefined) {
        return result
      } else {
        if (isThenable(returnedResult)) {
          return returnedResult.then((resolvedReturnedResult) => resolvedReturnedResult === undefined ? result : resolvedReturnedResult)
        }
        return returnedResult
      }
    }
    const interceptor = {
      fulfilled: wrappedFulfilled,
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
