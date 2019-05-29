import { getEnvObj } from './utils'
import promisify from './promisify'

function proxyAll (target, usePromise, whiteList) {
  const envObj = getEnvObj()
  const list = promisify(envObj, usePromise, whiteList)

  Object.keys(list).forEach(key => {
    try {
      target[key] = list[key]
    } catch (e) {}
  })
}

export default proxyAll
