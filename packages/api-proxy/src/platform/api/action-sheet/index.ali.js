import { ENV_OBJ, changeOpts } from '../../../common/js'
import { noop } from '@mpxjs/utils'

function showActionSheet (options = {}) {
  const opts = changeOpts(options, {
    itemList: 'items'
  })

  const cacheSuc = opts.success || noop
  const cacheFail = opts.fail || noop

  opts.success = function (res) {
    const sucRes = changeOpts(res, {
      index: 'tapIndex'
    })
    if (sucRes.tapIndex === -1) {
      cacheFail.call(this, {
        errMsg: 'showActionSheet:fail cancel'
      })
    } else {
      cacheSuc.call(this, sucRes)
    }
  }

  return ENV_OBJ.showActionSheet(opts)
}

export {
  showActionSheet
}
