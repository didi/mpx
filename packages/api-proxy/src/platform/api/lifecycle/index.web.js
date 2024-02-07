import { isBrowser, throwSSRWarning } from '../../../common/js'
function getEnterOptionsSync () {
  if (!isBrowser) {
    throwSSRWarning('getEnterOptionsSync API is running in non browser environments')
    return
  }
  return global.__mpxEnterOptions || {}
}

export {
  getEnterOptionsSync
}
