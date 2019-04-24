import { getEnvObj } from './utils'
import promisify from './promisify'

function proxyAll (target, usePromise, whiteList) {
  const envObj = getEnvObj()
  const list = promisify(envObj, usePromise, whiteList)

  Object.assign(target, list)
}

export default proxyAll
