import requestAdapter from './request'
import CancelToken from './cancelToken'
import InterceptorManager from './interceptorManager'
import RequestQueue from './queue'
import { requestProxy } from './proxy'
import { isNotEmptyArray, isNotEmptyObject } from './util'

export default class XFetch {
  constructor (options, MPX) {
    this.CancelToken = CancelToken
    // this.requestAdapter = (config) => requestAdapter(config, MPX)
    // 当存在 useQueue 配置时，才使用 this.queue 变量
    if (options && options.useQueue && typeof options.useQueue === 'object') {
      this.queue = new RequestQueue({
        adapter: (config) => requestAdapter(config, MPX),
        ...options.useQueue
      })
    } else {
      this.requestAdapter = (config) => requestAdapter(config, MPX)
    }
    this.interceptors = {
      request: new InterceptorManager(),
      response: new InterceptorManager()
    }
  }

  create (options) {
    return new XFetch(options)
  }

  addLowPriorityWhiteList (rules) {
    // when useQueue not optioned, this.quene is undefined
    this.queue && this.queue.addLowPriorityWhiteList(rules)
  }

  setProxy (options) {
    // 代理配置
    if (isNotEmptyArray(options)) {
      this.proxyOptions = options
    } else if (isNotEmptyObject(options)) {
      this.proxyOptions = [options]
    } else {
      console.error('仅支持不为空的对象或数组')
    }
  }

  getProxy () {
    // 返回代理配置
    return this.proxyOptions
  }

  clearProxy () {
    // 解除代理配置
    this.proxyOptions = undefined
  }

  // 向前追加代理规则
  prependProxy (proxyRules) {
    if (isNotEmptyArray(proxyRules)) {
      this.proxyOptions = proxyRules.concat(this.proxyOptions)
    } else if (isNotEmptyObject(proxyRules)) {
      this.proxyOptions.unshift(proxyRules)
    } else {
      console.error('仅支持不为空的对象或数组')
    }
  }

  // 向后追加代理规则
  appendProxy (proxyRules) {
    if (isNotEmptyArray(proxyRules)) {
      this.proxyOptions = this.proxyOptions.concat(proxyRules)
    } else if (isNotEmptyObject(proxyRules)) {
      this.proxyOptions.push(proxyRules)
    } else {
      console.error('仅支持不为空的对象或数组')
    }
  }

  checkProxy (config) {
    return requestProxy(this.proxyOptions, config)
  }

  fetch (config, priority) {
    config.timeout = config.timeout || global.__networkTimeout
    // middleware chain
    const chain = []
    let promise = Promise.resolve(config)

    // use queue
    const request = (config) => {
      config = this.checkProxy(config) // proxy
      return this.queue ? this.queue.request(config, priority) : this.requestAdapter(config)
    }

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
