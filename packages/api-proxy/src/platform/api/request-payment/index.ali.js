import { ENV_OBJ, changeOpts, error } from '../../../common/js'
import { noop } from '@mpxjs/utils'

const TIPS_NAME = '支付宝环境 mpx'

function requestPayment (options = {}) {
  if (!options.tradeNO) {
    error(`请在支付函数 ${TIPS_NAME}.requestPayment 中添加 tradeNO 参数用于支付宝支付`)
  }

  const opts = changeOpts(options, {
    timeStamp: '',
    nonceStr: '',
    package: '',
    signType: '',
    paySign: ''
  })

  const cacheSuc = opts.success || noop
  const cacheFail = opts.fail || noop

  // 抹平用微信的 complete
  if (typeof opts.complete === 'function') {
    const cacheComplete = opts.complete
    opts.complete = function (res) {
      if (+res.resultCode === 9000) {
        res.errMsg = 'requestPayment:ok'
        cacheComplete.call(this, res)
      }
    }
  }

  opts.success = function (res) {
    if (+res.resultCode === 9000) {
      cacheSuc.call(this, res)
    } else {
      cacheFail.call(this, res)
    }
  }

  return ENV_OBJ.tradePay(opts)
}

export {
  requestPayment
}
