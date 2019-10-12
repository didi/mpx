import requestAdapter from './request'
import CancelToken from './cancelToken'
import RequestQueue from './queue'
import InterceptorManager from './interceptorManager'
export default class XFetch {
  constructor (options) {
    this.CancelToken = CancelToken
    this.queue = new RequestQueue({
      adapter: (config) => requestAdapter(config),
      ...options
    })
    this.interceptors = {
      request: new InterceptorManager(),
      response: new InterceptorManager()
    }
  }
  create (options) {
    return new XFetch(options)
  }
  lock () {
    this.queue.lock()
  }
  unlock () {
    this.queue.unlock()
  }
  addLowPriorityWhiteList (rules) {
    this.queue.addLowPriorityWhiteList(rules)
  }
  fetch (config, priority) {
    const request = () => this.queue.request(config, priority)
    // middleware chain
    const chain = []
    let promise = Promise.resolve(config)

    this.interceptors.request.forEach(function unshiftRequestInterceptors (interceptor) {
      chain.push(interceptor.fulfilled, interceptor.rejected)
    })

    chain.push(request, undefined)

    this.interceptors.response.forEach(function pushResponseInterceptors (interceptor) {
      chain.push(interceptor.fulfilled, interceptor.rejected)
    })

    while (chain.length) {
      promise = promise.then(chain.shift(), chain.shift())
    }

    return promise
  }
}
