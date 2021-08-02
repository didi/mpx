import { match } from 'path-to-regexp'
import { isArray, isFunction, isNotEmptyArray, isNotEmptyObject, isString, parseUrl } from './util'

/**
 * 匹配项所有属性值，在源对象都能找到匹配
 * @param test 匹配项
 * @param input 源对象
 * @returns {boolean}
 */
function attrMatch (test = {}, input = {}) {
  for (const key in test) {
    // value 值为 true 时 key 存在即命中匹配
    if (test.hasOwnProperty(key) && input.hasOwnProperty(key)) {
      // value 如果不是字符串需要进行序列化之后再匹配
      const testValue = isString(test[key]) ? test[key] : JSON.stringify(test[key])
      const inputValue = isString(input[key]) ? input[key] : JSON.stringify(input[key])
      if (test[key] === true || testValue === inputValue) {
        return true
      }
    }
  }
  return false
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
    params: tParams = {},
    data: tData = {},
    header: tHeader = {},
    method: tMethod = ''
  } = test

  const { baseUrl, protocol, hostname, port, path } = parseUrl(url)

  // 如果待匹配项为空，则认为匹配成功
  // url 匹配
  let urlMatched = false
  let matchParams = {}
  if (tUrl) {
    // 处理协议头
    const protocolReg = /^(http(s?):|:protocol)/
    const reg = /^\/\//
    const handleTUrl = protocolReg.test(tUrl) ? tUrl : (reg.test(tUrl) ? ':protocol' : ':protocol\\://') + tUrl

    try {
      // 匹配结果参数
      const matcher = match(handleTUrl)
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

  // params 匹配
  const paramsMatched = isNotEmptyObject(tParams) ? attrMatch(tParams, params) : true
  // data 匹配
  const dataMatched = isNotEmptyObject(tData) ? attrMatch(tData, data) : true
  // header 匹配
  const headerMatched = isNotEmptyObject(tHeader) ? attrMatch(tHeader, header) : true
  // method 匹配
  let methodMatched = false
  const methodUpper = method.toUpperCase()
  if (isArray(tMethod)) {
    const tMethodUpper = tMethod.map((item) => {
      return item.toUpperCase()
    })
    methodMatched = isNotEmptyArray(tMethodUpper) ? tMethodUpper.indexOf(methodUpper) > -1 : true
  } else if (isString(tMethod)) {
    methodMatched = tMethod.toUpperCase() === method.toUpperCase()
  }

  // 是否匹配
  const matched = urlMatched && paramsMatched && dataMatched && headerMatched && methodMatched

  return {
    matched,
    matchParams
  }
}

/**
 * 处理 config
 * @param config 请求配置项
 * @param proxy 目标代理配置
 * @param matchParams 匹配完成后的参数
 * @returns {config}
 */
function doProxy (config, proxy, matchParams) {
  let finalConfig = config
  if (isNotEmptyObject(proxy)) {
    const { url = '', params = {}, data = {}, header = {}, method = '' } = config
    const {
      url: pUrl = '',
      protocol: pProtocol = '',
      host: pHost = '',
      port: pPort = '',
      path: pPath = '',
      params: pParams = {},
      data: pData = {},
      header: pHeader = {},
      method: pMethod = '',
      custom
    } = proxy

    // 如果存在 custom 直接执行 custom 函数获取返回结果
    if (isFunction(custom)) {
      return custom(config, matchParams) || config
    }

    let finalUrl = url
    const { protocol, hostname, port, path } = parseUrl(url)

    if (pUrl) {
      finalUrl = pUrl
      for (let k in matchParams) {
        // 替换 $
        const reg = new RegExp(`\\$${k}`, 'g')
        finalUrl = finalUrl.replace(reg, matchParams[k])
      }
    } else if (pProtocol || pHost || pPort || pPath) {
      const compoProtocol = pProtocol || protocol
      const compoHost = pHost || hostname
      const compoPort = pPort || port
      const compoPath = pPath || path
      finalUrl = compoProtocol + '//' + compoHost + (compoPort && ':' + compoPort) + compoPath
    }

    const finalHeader = Object.assign(header, pHeader)
    const finalParams = Object.assign(params, pParams)
    const finalData = Object.assign(data, pData)
    const finalMethod = pMethod || method

    finalConfig = {
      url: finalUrl,
      header: finalHeader,
      params: finalParams,
      data: finalData,
      method: finalMethod
    }
  }

  return finalConfig
}

// 请求拦截
export function requestProxy (options, config) {
  const configBackup = Object.assign({}, config) // 备份请求配置

  let newConfig = config

  options && options.some((item) => {
    const { test, proxy, waterfall } = item
    const { matched, matchParams } = doTest(configBackup, test)
    if ((isFunction(test.custom) && test.custom(configBackup)) || matched) {
      // 匹配时
      newConfig = doProxy(newConfig, proxy, matchParams)

      // waterfall 模式
      return !waterfall

    }
  })

  return Object.assign({}, configBackup, newConfig)
}
