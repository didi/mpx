import { error } from '../utils'
import wxToAliApi from './wxToAli'
import promisify from '../promisify'

function transformApi (target, options) {
  const platformMap = {
    'wx_ali': wxToAliApi
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
    if (options.exclude.includes(api)) {
      return
    }

    const descriptor = {
      enumerable: true,
      configurable: true
    }

    descriptor.get = () => {
      return (...args) => {
        const to = options.to
        let from = args.splice(args.length - 1)[0]

        if (typeof from !== 'string' || !platforms.includes(from)) {
          args.concat(from)
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
