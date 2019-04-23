import { getEnvObj } from './utils'

export default function proxyAll (target) {
  let envObj = getEnvObj()

  Object.keys(envObj).forEach(key => {
    if (typeof envObj[key] === 'function') {
      target[key] = function (...args) {
        envObj[key].apply(envObj, args)
      }
    }
  })
}
