import { error } from '../utils'
import getWxToAliApi from './wxToAli'
import promisify from '../promisify'

function transformApi (target, options) {
  const wxToAliApi = getWxToAliApi({ optimize: options.optimize })
  const platformMap = {
    'wx_ali': wxToAliApi,
    'qq_ali': wxToAliApi,
    'swan_ali': wxToAliApi,
    'tt_ali': wxToAliApi
  }
  const platforms = ['wx', 'ali', 'swan', 'qq', 'tt']
  const cacheTarget = {}

  Object.keys(target).forEach(key => {
    cacheTarget[key] = target[key]
  })

  function joinName (from = '', to = '') {
    return `${from}_${to}`
  }

  Object.keys(wxToAliApi).forEach(api => {
    if (~options.exclude.indexOf(api)) {
      return
    }

    const descriptor = {
      enumerable: true,
      configurable: true
    }

    descriptor.get = () => {
      return (...args) => {
        const to = options.to
        let from = args.pop()

        if (typeof from !== 'string' || !~platforms.indexOf(from)) {
          args.push(from)
          from = options.from
        }

        if (platformMap[joinName(from, to)] && platformMap[joinName(from, to)][api]) {
          const result = promisify({
            [api]: platformMap[joinName(from, to)][api]
          }, options.usePromise, options.whiteList)

          return result[api].apply(target, args)
        }

        if (cacheTarget[api]) {
          return cacheTarget[api].apply(target, args)
        } else {
          error(`当前环境不存在 ${api} 方法`)
        }
      }
    }

    Object.defineProperty(target, api, descriptor)
  })
}

export default transformApi
