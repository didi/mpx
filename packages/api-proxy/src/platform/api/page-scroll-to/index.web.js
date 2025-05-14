import { successHandle, failHandle, isBrowser, throwSSRWarning } from '../../../common/js'
import { nextTick } from '../next-tick'

export function pageScrollTo (options = {}) {
  if (!isBrowser) {
    throwSSRWarning('pageScrollTo API is running in non browser environments')
    return
  }
  nextTick(() => {
    const ms = global.__ms
    const { success, fail, complete } = options

    if (!ms) {
      return failHandle({
        errMsg: 'pageScrollTo:fail'
      }, fail, complete)
    }

    ms.pageScrollTo(options)
    successHandle({
      errMsg: 'pageScrollTo:ok'
    }, success, complete)
  })
}
