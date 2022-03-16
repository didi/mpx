import requestAdapter from './request'
import CancelToken from './cancelToken'
import InterceptorManager from './interceptorManager'
import RequestQueue from './queue'
import { requestProxy } from './proxy'
import { requestMock } from './mock'
import { validate } from './validator'
import { isNotEmptyArray, isNotEmptyObject, transformReq, isThenable, formatCacheKey, checkCacheConfig, sortObject } from './util'

export default class XFetch {
  constructor (options, MPX) {
    this.CancelToken = CancelToken
    this.cacheRequestData = {}
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
    if (options && options.proxy) this.setProxy(options.proxy)
    if (options && options.mock) this.setMock(options.mock)
    this.interceptors = {
      request: new InterceptorManager(),
      response: new InterceptorManager()
    }
  }

  static normalizeConfig (config) {
    if (!config.url) {
      throw new Error('no url')
    }

    transformReq(config)

    if (!config.method) {
      config.method = 'GET'
    } else {
      config.method = config.method.toUpperCase()
    }

    const params = config.params || {}

    if (/^GET|DELETE|HEAD$/i.test(config.method)) {
      Object.assign(params, config.data)
      // get 请求都以params为准
      delete config.data
    }

    if (isNotEmptyObject(params)) {
      config.params = params
    }

    if (/^POST|PUT$/i.test(config.method)) {
      const header = config.header || {}
      let contentType = header['content-type'] || header['Content-Type']
      if (config.emulateJSON && !contentType) {
        header['content-type'] = 'application/x-www-form-urlencoded'
        config.header = header
      }
      delete config.emulateJSON
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

  setMock (options) {
    if (isNotEmptyArray(options)) {
      this.mockOptions = options
    } else if (isNotEmptyObject(options)) {
      this.mockOptions = [options]
    } else {
      console.error('仅支持不为空的对象或数组')
    }
  }

  getMock () {
    return this.mockOptions
  }

  clearMock () {
    this.mockOptions = undefined
  }

  getProxy () {
    // 返回代理配置
    return this.proxyOptions
  }

  clearProxy () {
    // 解除代理配置
    this.proxyOptions = undefined
  }

  setValidator (options) {
    // 添加校验配置
    if (isNotEmptyArray(options)) {
      this.validatorOptions = options
    } else if (isNotEmptyObject(options)) {
      this.validatorOptions = [options]
    } else {
      console.error('仅支持不为空的对象或数组')
    }
  }

  getValidator () {
    // 返回校验配置
    return this.validatorOptions
  }

  // 校验参数规则
  checkValidator (config) {
    return validate(this.validatorOptions, config)
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

  checkPreCache (config) {
    const cacheKey = formatCacheKey(config.url)
    const cacheRequestData = this.cacheRequestData[cacheKey]
    if (cacheRequestData) {
      delete this.cacheRequestData[cacheKey]
      const cacheInvalidationTime = config.cacheInvalidationTime || 5000
      // 缓存是否过期 >5s 则算过期
      if (Date.now() - cacheRequestData.lastTime <= cacheInvalidationTime &&
        checkCacheConfig(config, cacheRequestData)) {
        return cacheRequestData.responsePromise
      }
    } else if (config.isPre) {
      this.cacheRequestData[cacheKey] = {
        cacheKey,
        data: sortObject(config.data),
        params: sortObject(config.params),
        method: config.method || '',
        responsePromise: null,
        lastTime: Date.now()
      }
    }
  }

  fetch (config, priority) {
    // 检查缓存
    const responsePromise = this.checkPreCache(config)
    if (responsePromise) return responsePromise

    config.timeout = config.timeout || global.__networkTimeout
    // middleware chain
    const chain = []
    let promise = Promise.resolve(config)

    // use queue
    const request = (config) => {
      // 对config进行以下正规化处理：
      // 1. 检查config.url存在
      // 2. 抹平微信/支付宝header/headers字段差异
      // 3. 填充默认method为GET, method大写化
      // 4. 抽取url中query合并至config.params
      // 5. 对于类GET请求将config.data移动合并至config.params(最终发送请求前进行统一序列化并拼接至config.url上)
      // 6. 对于类POST请求将config.emulateJSON实现为config.header['content-type'] = 'application/x-www-form-urlencoded'
      // 后续请求处理都应基于正规化后的config进行处理(proxy/mock/validate/serialize)
      XFetch.normalizeConfig(config)

      if (this.mockOptions) {
        let mockData = requestMock(this.mockOptions, config)
        if (isThenable(mockData)) return mockData
      }

      const checkRes = this.checkValidator(config)
      const validatorRes = isObject(checkRes) ? checkRes.valid : checkRes
      if (typeof validatorRes !== 'undefined' && !validatorRes) {
        return Promise.reject(new Error(`xfetch参数校验错误 ${config.url} ${checkRes?.message?.length ? 'error:' + checkRes.message.join(',') : ''}`))
      }
      if (this.proxyOptions) {
        config = this.checkProxy(config)
      }
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

    if (config.isPre) {
      const cacheKey = formatCacheKey(config.url)
      this.cacheRequestData[cacheKey] && (this.cacheRequestData[cacheKey].responsePromise = promise)
    }

    return promise
  }
}
