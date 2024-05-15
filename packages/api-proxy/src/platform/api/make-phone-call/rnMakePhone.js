import { webHandleSuccess, webHandleFail } from '../../../common/js'
import { Linking } from 'react-native'

const makePhoneCall = function (options) {
  const {
    phoneNumber = '',
    success = null,
    fail = null,
    complete = null
  } = options

  Linking.openURL(`tel:${phoneNumber}`).then(() => {
    const result = {
      errMsg: 'makePhoneCall:ok'
    }
    webHandleSuccess(result, success, complete)
  }).catch(() => {
    const result = {
      errMsg: 'makePhoneCall:fail cancel'
    }
    webHandleFail(result, fail, complete)
  })
}

export {
  makePhoneCall
}
