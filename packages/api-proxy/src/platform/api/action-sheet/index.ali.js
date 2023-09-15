import { changeOpts, getEnvObj, noop } from '../../../common/js'
const ALI_OBJ = getEnvObj()
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

  ALI_OBJ.showActionSheet(opts)
}

export {
  showActionSheet
}
