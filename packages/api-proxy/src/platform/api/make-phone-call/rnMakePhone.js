import { successHandle, failHandle } from '../../../common/js'
import { Linking } from 'react-native'

const makePhoneCall = function (options = {}) {
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
    successHandle(result, success, complete)
  }).catch(() => {
    const result = {
      errMsg: 'makePhoneCall:fail cancel'
    }
    failHandle(result, fail, complete)
  })
}

export {
  makePhoneCall
}
