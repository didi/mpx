import { wxToAliApi } from './wxToAli'

const transedApi = []

function transformApi (target, exclude, fromGlobal, to) {
  const platformMap = {
    'wx_ali': wxToAliApi
  }
  const platforms = ['wx', 'ali', 'swan', 'qq', 'tt']

  function joinName (from = '', to = '') {
    return `${from}_${to}`
  }

  Object.keys(wxToAliApi).forEach(api => {
    if (exclude.includes(api)) {
      return
    }

    transedApi.push(api)

    const descriptor = {
      enumerable: true,
      configurable: true
    }

    descriptor.get = () => {
      return (...args) => {
        let from = args.splice(args.length - 1)[0]

        if (typeof from !== 'string' || !platforms.includes(from)) {
          args.concat(from)
          from = fromGlobal
        }

        if (platformMap[joinName(from, to)] && platformMap[joinName(from, to)][api]) {
          return platformMap[joinName(from, to)][api].apply(target, args)
        }

        return target[api].apply(target, args)
      }
    }

    Object.defineProperty(target, api, descriptor)
  })
}

export {
  transformApi,
  transedApi
}
