import { getEnvObj } from './utils'

export default function proxyAll (traget) {
  let envObj = getEnvObj()

  Object.keys(envObj).forEach(key => {
    if (typeof envObj[key] === 'function') {
      traget[key] = envObj[key]
    }
  })
}
