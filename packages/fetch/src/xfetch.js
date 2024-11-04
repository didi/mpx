import requestAdapter from './request'
import CancelToken from './cancelToken'
import InterceptorManager from './interceptorManager'
import RequestQueue from './queue'
import { requestProxy } from './proxy'
import { Validator } from './validator'
import { isNotEmptyArray, isNotEmptyObject, transformReq, isObject, formatCacheKey, checkCacheConfig, isArray, isString } from './util'

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
    this.onValidatorError = options?.onValidatorError || (error => {
      console.error(error)
    })
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
      const contentType = header['content-type'] || header['Content-Type']
      if (config.emulateJSON && !contentType) {
        header['content-type'] = 'application/x-www-form-urlencoded'
        config.header = header
      }
      delete config.emulateJSON
    }

    if (!isObject(config.usePre)) {
      config.usePre = {
        enable: !!config.usePre
      }
    }
    config.usePre.cacheInvalidationTime = config.usePre.cacheInvalidationTime || 3000 // 默认值3000
    config.usePre.ignorePreParamKeys = config.usePre.ignorePreParamKeys || [] // 默认空数组
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

  setValidator (options) {
    // 添加校验配置
    if (isNotEmptyObject(options)) {
      const preValidatorOptions = this.validatorOptions || {}
      this.validatorOptions = options || {}
      Object.keys(this.validatorOptions).forEach(key => {
        const preOption = preValidatorOptions[key]
        const option = this.validatorOptions[key]
        const objectRule = key === 'rules' && isNotEmptyObject(option)
        const stringRule = (key === 'exclude' || key === 'include') && isString(option)
        const isEnv = key === 'env'
        if (isNotEmptyArray(option)) {
          this.validatorOptions[key] = isArray(preOption) ? preOption.concat(option) : option
        } else if (objectRule || stringRule) {
          this.validatorOptions[key] = isArray(preOption) ? preOption.concat([option]) : [option]
        } else if (isEnv) {
          this.validatorOptions[key] = isObject(preOption) ? Object.assign({}, preOption, option) : option
        } else {
          console.error('rules仅支持不为空的数组或对象, include和exclude仅支持不为空的字符串或对象')
        }
      })
    }
  }

  getValidator () {
    // 返回校验配置
    return this.validatorOptions
  }

  // 校验参数规则
  checkValidator (config) {
    const env = Object.assign({}, this.validatorOptions?.env, config?.validate?.env)
    const options = Object.assign({}, this.validatorOptions, config.validate, { env: env })
    return Validator(options, config)
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
    // 未设置预请求 则直接 return
    if (!config.usePre.enable) return false
    const cacheKey = formatCacheKey(config.url)
    const cacheRequestData = this.cacheRequestData[cacheKey]
    if (cacheRequestData) {
      // 缓存是否过期：大于cacheInvalidationTime（默认为3s）则算过期
      const isNotExpired = Date.now() - cacheRequestData.lastTime <= config.usePre.cacheInvalidationTime
      if (isNotExpired && checkCacheConfig(config, cacheRequestData) && cacheRequestData.responsePromise) {
        return cacheRequestData.responsePromise.then(response => {
          // 添加 isCache 标识该请求来源于缓存
          return { ...response, isCache: true }
        })
      } else {
        delete this.cacheRequestData[cacheKey]
      }
    }
    const { params, data, method } = config
    this.cacheRequestData[cacheKey] = {
      cacheKey,
      params,
      data,
      method,
      lastTime: Date.now(),
      responsePromise: null
    }
    return false
  }

  isCancel (value) {
    return !!(value && value.__CANCEL__)
  }

  fetch (config, priority) {
    // 检查缓存
    // middleware chain
    const chain = []
    let promise = Promise.resolve(config)

    // use queue
    const request = (config) => {
      // 对config进行以下正规化处理：
      // 1. 检查config.url存在
      // 2. 抹平微信/支付宝header/headers字段差异
      // 3. 填充默认method为GET, method大写化
      // 4. 对于类GET请求将config.data移动合并至config.params(最终发送请求前进行统一序列化并拼接至config.url上)
      // 5. 对于类POST请求将config.emulateJSON实现为config.header['content-type'] = 'application/x-www-form-urlencoded'
      // 后续请求处理都应基于正规化后的config进行处理(proxy/mock/validate/serialize)
      XFetch.normalizeConfig(config)

      // 检查缓存
      const responsePromise = this.checkPreCache(config)
      if (responsePromise && typeof config.usePre.onUpdate !== 'function') {
        return responsePromise
      }

      try {
        const checkRes = this.checkValidator(config)
        const isWrong = (typeof checkRes === 'boolean' && !checkRes) || (isObject(checkRes) && !checkRes.valid)
        if (isWrong) {
          this.onValidatorError(`xfetch参数校验错误 ${checkRes.url} ${checkRes?.errorResult ? 'error:' + checkRes.errorResult : ''} ${checkRes?.warningResult ? 'warning:' + checkRes?.warningResult : ''}`)
        }
      } catch (e) {
        console.log('xfetch参数校验错误', e)
      }
      config = this.checkProxy(config) // proxy

      let promise = this.queue ? this.queue.request(config, priority) : this.requestAdapter(config)
      // 后置拦截器
      const chain = []
      this.interceptors.response.forEach(function pushResponseInterceptors (interceptor) {
        chain.push(interceptor.fulfilled, interceptor.rejected)
      })
      while (chain.length) {
        promise = promise.then(chain.shift(), chain.shift())
      }

      // 如果开启缓存，则将 promise 存入缓存
      if (config.usePre.enable) {
        const cacheKey = formatCacheKey(config.url)
        this.cacheRequestData[cacheKey] && (this.cacheRequestData[cacheKey].responsePromise = promise)
      }

      // 如果命中缓存，则将缓存 responsePromise 与最新 promise 竞速，返回最快的 promise
      if (responsePromise && typeof config.usePre.onUpdate === 'function') {
        const returnPromise = Promise.any([responsePromise, promise])
        returnPromise.then(response => {
          if (response.isCache) { // 如果预请求先返回，则等待实际请求返回后回调 usePre.onUpdate
            promise.then(response => {
              // 回调 usePre.onUpdate
              config.usePre.onUpdate(response)
            })
          }
        })
        return returnPromise
      }

      return promise
    }

    this.interceptors.request.forEach(function unshiftRequestInterceptors (interceptor) {
      chain.push(interceptor.fulfilled, interceptor.rejected)
    })

    chain.push(request, undefined)

    while (chain.length) {
      promise = promise.then(chain.shift(), chain.shift())
    }

    return promise
  }
}
