import { match } from 'path-to-regexp'

import { type, isFunction, isArray, isString, forEach, isNumber } from '@mpxjs/utils/src/base'
import { serialize, buildUrl, parseUrl } from '@mpxjs/utils/src/url'

const toString = Object.prototype.toString
const hasOwnProperty = Object.prototype.hasOwnProperty
function hasOwn (obj, key) {
  return hasOwnProperty.call(obj, key)
}

function isObject (val) {
  return type(val) === 'Object'
}

function isThenable (obj) {
  return obj && typeof obj.then === 'function'
}

// 不为空对象
function isNotEmptyObject (obj) {
  return obj && isObject(obj) && Object.keys(obj).length > 0
}

// 不为空数组
function isNotEmptyArray (ary) {
  return ary && isArray(ary) && ary.length > 0
}

function transformReq (config) {
  // 抹平wx & ali 请求参数
  let header = config.header || config.headers
  if (config.header && config.headers) {
    header = Object.assign({}, config.headers, config.header)
  }
  const descriptor = {
    get () {
      return header
    },
    set (val) {
      header = val
    },
    enumerable: true,
    configurable: true
  }
  Object.defineProperties(config, {
    header: descriptor,
    headers: descriptor
  })
}

function transformRes (res) {
  // 抹平wx & ali 响应数据
  if (res.status === undefined) {
    res.status = res.statusCode
  } else {
    res.statusCode = res.status
  }

  if (res.header === undefined) {
    res.header = res.headers
  } else {
    res.headers = res.header
  }
  return res
}

function deepMerge () {
  const result = {}

  function assignValue (val, key) {
    if (typeof result[key] === 'object' && typeof val === 'object') {
      result[key] = deepMerge(result[key], val)
    } else {
      result[key] = val
    }
  }

  for (let i = 0; i < arguments.length; i++) {
    forEach(arguments[i], assignValue)
  }
  return result
}

/**
 * 匹配项所有属性值，在源对象都能找到匹配
 * @param test 匹配项
 * @param input 源对象
 * @returns {boolean}
 */
function attrMatch (test = {}, input = {}) {
  let result = true
  for (const key in test) {
    // value 值为 true 时 key 存在即命中匹配
    if (hasOwn(test, key) && hasOwn(input, key)) {
      if (test[key] === true) continue
      // value 如果不是字符串需要进行序列化之后再匹配
      const testValue = isString(test[key]) ? test[key] : JSON.stringify(test[key])
      const inputValue = isString(input[key]) ? input[key] : JSON.stringify(input[key])
      if (testValue !== inputValue) {
        result = false
      }
    } else {
      result = false
    }
  }
  return result
}

/**
 * 匹配 rule 中的对应项
 * @param config 原请求配置项
 * @param test 匹配配置
 * @returns {{matchParams, matched: boolean}}
 */
function doTest (config, test) {
  const { url, params = {}, data = {}, header = {}, method = 'GET' } = config
  const {
    url: tUrl = '',
    protocol: tProtocol = '',
    host: tHost = '',
    port: tPort = '',
    path: tPath = '',
    search: tSearch = '',
    params: tParams = {},
    data: tData = {},
    header: tHeader = {},
    method: tMethod = ''
  } = test

  const { baseUrl, protocol, hostname, port, path, search } = parseUrl(url)

  // 如果待匹配项为空，则认为匹配成功
  // url 匹配
  let urlMatched = false
  let matchParams = {}
  if (tUrl) {
    // 处理协议头
    const protocolReg = /^(?:\w+(\\)?:|(:\w+))\/\//

    const hasProtocol = protocolReg.exec(tUrl)

    let handledTUrl = tUrl

    if (hasProtocol) {
      if (!hasProtocol[1] && !hasProtocol[2]) {
        handledTUrl = tUrl.replace(':', '\\:')
      }
    } else {
      handledTUrl = (tUrl.startsWith('//') ? ':protocol' : ':protocol//') + tUrl
    }

    try {
      // 匹配结果参数
      const matcher = match(handledTUrl)
      const result = matcher(baseUrl)
      urlMatched = !!result
      matchParams = result.params
    } catch (error) {
      console.error('Test url 不符合规范，test url 中存在 : 或者 ? 等保留字符，请在前面添加 \\ 进行转义，如 https\\://baidu.com/xxx.')
    }
  } else {
    // protocol 匹配
    const protocolMatched = tProtocol ? tProtocol === protocol : true
    // host 匹配
    const hostMatched = tHost ? tHost === hostname : true
    // port 匹配
    const portMatched = tPort ? tPort === port : true
    // path 匹配
    const pathMatched = tPath ? tPath === path : true

    urlMatched = protocolMatched && hostMatched && portMatched && pathMatched
  }

  // search 匹配
  const searchMatched = tSearch ? search.includes(tSearch) : true
  // params 匹配
  const paramsMatched = isNotEmptyObject(tParams) ? attrMatch(tParams, params) : true
  // data 匹配
  const likeGet = /^GET|DELETE|HEAD$/i.test(method)
  const dataMatched = isNotEmptyObject(tData) ? attrMatch(tData, likeGet ? params : data) : true
  // header 匹配
  const headerMatched = isNotEmptyObject(tHeader) ? attrMatch(tHeader, header) : true
  // method 匹配
  let methodMatched = false
  if (isArray(tMethod)) {
    const tMethodUpper = tMethod.map((item) => {
      return item.toUpperCase()
    })
    methodMatched = isNotEmptyArray(tMethodUpper) ? tMethodUpper.indexOf(method) > -1 : true
  } else if (isString(tMethod)) {
    methodMatched = tMethod ? tMethod.toUpperCase() === method : true
  }

  // 是否匹配
  const matched = urlMatched && searchMatched && paramsMatched && dataMatched && headerMatched && methodMatched

  return {
    matched,
    matchParams
  }
}

function formatCacheKey (url) {
  if (typeof url !== 'string' || !url.includes('//')) return url
  return url.split('//')[1].split('?')[0]
}

function checkCacheConfig (thisConfig, cacheData) {
  let paramsEquals = false
  if (typeof thisConfig.usePre.equals === 'function') {
    paramsEquals = thisConfig.usePre.equals(thisConfig, cacheData)
  } else {
    paramsEquals = compareParams(thisConfig.params, cacheData.params, thisConfig.usePre.ignorePreParamKeys) &&
        compareParams(thisConfig.data, cacheData.data, thisConfig.usePre.ignorePreParamKeys)
  }
  return paramsEquals && thisConfig.method === cacheData.method
}

function compareParams (params, cacheParams, ignoreParamKeys = []) {
  // 类型不一致
  if (toString.call(params) !== toString.call(cacheParams)) {
    return false
  }
  // params 不为对象，则直接判断是否相等
  if (!isObject(params)) {
    return params === cacheParams
  }
  // ignoreParamKeys 类型应为字符串&字符串数组 否则 ignoreParamKeys = [] 不考虑 ignoreParamKeys
  if (!(isString(ignoreParamKeys) || isArray(ignoreParamKeys))) {
    console.error('compareParams: ignoreParamKeys 不合法, ignoreParamKeys 只支持字符串和数组类型，请检查！！！')
    ignoreParamKeys = []
  } else if (isString(ignoreParamKeys)) {
    // ignoreParamKeys 字符串数组化
    ignoreParamKeys = ignoreParamKeys.trim().split(',')
  }
  const paramsKeys = Object.keys(params).filter(key => !ignoreParamKeys.includes(key))
  const cacheParamsKeys = Object.keys(cacheParams).filter(key => !ignoreParamKeys.includes(key))
  // key长度不等
  if (paramsKeys.length !== cacheParamsKeys.length) {
    return false
  }
  return paramsKeys.every(key => {
    if (!cacheParamsKeys.includes(key)) {
      // 缓存参数中不存在当前key
      return false
    } else if (ignoreParamKeys.includes(key)) {
      // 忽略对比参数值 则直接返回true
      return true
    } else if (toString.call(params[key]) !== toString.call(cacheParams[key])) {
      // value 类型不一致
      return false
    } else if (isObject(params[key]) || isArray(params[key])) {
      // value 对象&数组
      return JSON.stringify(params[key]) === JSON.stringify(cacheParams[key])
    } else {
      return params[key] === cacheParams[key]
    }
  })
}

export {
  isThenable,
  isFunction,
  isNumber,
  parseUrl,
  deepMerge,
  doTest,
  buildUrl,
  serialize,
  transformRes,
  isString,
  isArray,
  isObject,
  type,
  isNotEmptyArray,
  isNotEmptyObject,
  transformReq,
  formatCacheKey,
  checkCacheConfig
}
