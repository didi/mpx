import { getEnvObj } from './utils'
import promisify from './promisify'

function proxyAll (target, usePromise, whiteList) {
  const envObj = getEnvObj()
  const list = promisify(envObj, usePromise, whiteList)
  const platforms = ['wx', 'ali', 'swan', 'qq', 'tt']

  Object.keys(list).forEach(api => {
    try {
      target[api] = (...args) => {
        const platform = args.pop()
        if (typeof platform !== 'string' || !~platforms.indexOf(platform)) {
          args.push(platform)
        }
        return list[api].apply(target, args)
      }
    } catch (e) {} // 支付宝不支持重写 call 方法
  })
}

export default proxyAll
