import { error, getEnvObj } from './utils'
import getWxToAliApi from './platform/wxToAli'
import promisify from './promisify'

const fromMap = genFromMap(['wx', 'ali', 'swan', 'qq', 'tt'])

function genFromMap (platforms = []) {
  const result = {}
  platforms.forEach((platform) => {
    result[`__mpx_src_mode_${platform}__`] = platform
  })
  return result
}

function joinName (from = '', to = '') {
  return `${fromMap[from]}_${to}`
}

function transformApi (target, options) {
  const envObj = getEnvObj()
  const wxToAliApi = getWxToAliApi({ optimize: options.optimize })
  const platformMap = {
    'wx_ali': wxToAliApi,
    'qq_ali': wxToAliApi,
    'swan_ali': wxToAliApi,
    'tt_ali': wxToAliApi
  }
  const needProxy = Object.assign({}, envObj, wxToAliApi)

  Object.keys(needProxy).forEach(api => {
    try {
      target[api] = (...args) => {
        const transedApi = Object.create(null)
        const to = options.to

        let from = args.pop()

        if (typeof from !== 'string' || !fromMap[from]) {
          args.push(from)
          from = options.from
        }

        if (
          platformMap[joinName(from, to)] &&
          platformMap[joinName(from, to)][api] &&
          options.exclude.indexOf(api) < 0
        ) {
          transedApi[api] = platformMap[joinName(from, to)][api]
        } else if (envObj[api]) {
          transedApi[api] = envObj[api]
        } else {
          error(`当前环境不存在 ${api} 方法`)
          return
        }

        if (options.usePromise) {
          const result = promisify(transedApi, options.whiteList)
          return result[api].apply(target, args)
        } else {
          return transedApi[api].apply(target, args)
        }
      }
    } catch (e) {} // 支付宝不支持重写 call 方法
  })
}

export default transformApi
