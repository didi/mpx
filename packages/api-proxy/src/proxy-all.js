import { getEnvObj } from './utils'
import { promisify } from './promisify'

export default function proxyAll (target, usePromise) {
  let envObj = getEnvObj()

  Object.keys(envObj).forEach(key => {
    if (typeof envObj[key] === 'function') {
      const
      target[key] = function (...args) {
        envObj[key].apply(envObj, args)
      }
    }
  })
}
