import {
  isFunction,
  isNotEmptyObject,
  parseUrl,
  deepMerge,
  doTest
} from './util'

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
    const { url = '', params = {}, data = {}, header = {}, method = 'GET' } = config
    const {
      url: pUrl = '',
      protocol: pProtocol = '',
      host: pHost = '',
      port: pPort = '',
      path: pPath = '',
      search: pSearch = '',
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

    const { baseUrl, protocol, hostname, port, path, search } = parseUrl(url)

    let finalUrl = baseUrl

    if (pUrl) {
      finalUrl = pUrl
      for (const k in matchParams) {
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

    let finalSearch = pSearch || search
    if (finalSearch && !finalSearch.startsWith('?')) {
      finalSearch = '?' + finalSearch
    }

    finalUrl = finalUrl + finalSearch

    const finalHeader = Object.assign(header, pHeader)
    const finalParams = deepMerge(params, pParams)
    const likeGet = /^GET|DELETE|HEAD$/i.test(method)
    const curData = likeGet ? params : data
    const finalData = typeof curData === 'object' ? deepMerge(curData, pData) : curData
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
    return false
  })

  return Object.assign({}, configBackup, newConfig)
}
