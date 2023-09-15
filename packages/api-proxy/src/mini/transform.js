import { error, getEnvObj, genFromMap, makeMap } from '../common/js'

const fromMap = genFromMap()

function joinName (from = '', to = '') {
  return `${fromMap[from]}_${to}`
}

function transformApi (options) {
  const envObj = getEnvObj()
  const platformApi = options.platformApi
  const needProxy = Object.create(null)
  const excludeMap = makeMap(options.exclude)
  Object.keys(envObj).concat(Object.keys(platformApi)).forEach((key) => {
    if (!excludeMap[key]) {
      needProxy[key] = envObj[key] || platformApi[key]
    }
  })
  const result = Object.create(null)
  Object.keys(needProxy).forEach(api => {
    // 非函数不做转换
    if (typeof needProxy[api] !== 'function') {
      result[api] = needProxy[api]
      return
    }

    result[api] = (...args) => {
      let from = options.from
      const to = options.to
      if (args.length > 0) {
        from = args.pop()
        if (typeof from !== 'string' || !fromMap[from]) {
          args.push(from)
          from = options.from
        }
      }

      const fromTo = joinName(from, to)
      if (options.custom[fromTo] && options.custom[fromTo][api]) {
        return options.custom[fromTo][api].apply(this, args)
      } else if (
        platformApi[api]
      ) {
        return platformApi[api].apply(this, args)
      } else if (envObj[api]) {
        return envObj[api].apply(this, args)
      } else {
        error(`当前环境不存在 ${api} 方法`)
      }
    }
  })

  return result
}

export default transformApi
