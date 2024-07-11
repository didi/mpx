import GetLocation from 'react-native-get-location'
import { envError, noop, successHandle, failHandle, defineUnsupportedProps } from '../../../common/js'

const getLocation = function (options) {
  const { isHighAccuracy = false, success = noop, fail = noop, complete = noop } = options
  GetLocation.getCurrentPosition({
    enableHighAccuracy: isHighAccuracy
  }).then(location => {
    Object.assign(location, {
      errMsg: 'getLocation:ok'
    })
    defineUnsupportedProps(location, ['horizontalAccuracy'])
    successHandle(location, success, complete)
  })
  .catch(error => {
    const result = {
      errMsg: `getLocation:fail ${error}`
    }
    failHandle(result, fail, complete)
  })
}

const openLocation = envError('openLocation')

const chooseLocation = envError('chooseLocation')

export {
  getLocation,
  openLocation,
  chooseLocation
}
