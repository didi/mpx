import { error, getEnvObj, genFromMap } from './utils'
import getWxToAliApi from './platform/wxToAli'

const fromMap = genFromMap()

function joinName (from = '', to = '') {
  return `${fromMap[from]}_${to}`
}

function transformApi (options) {
  const envObj = getEnvObj()
  const wxToAliApi = getWxToAliApi({ optimize: options.optimize })
  const platformMap = {
    'wx_ali': wxToAliApi,
    'qq_ali': wxToAliApi,
    'swan_ali': wxToAliApi,
    'tt_ali': wxToAliApi
  }
  const needProxy = Object.assign({}, envObj, wxToAliApi)
  const transedApi = Object.create(null)

  Object.keys(needProxy).forEach(api => {
    transedApi[api] = (...args) => {
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
        return platformMap[joinName(from, to)][api].apply(this, args)
      } else if (envObj[api]) {
        return envObj[api].apply(this, args)
      } else {
        error(`当前环境不存在 ${api} 方法`)
      }
    }
  })

  return transedApi
}

export default transformApi
