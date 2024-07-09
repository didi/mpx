import GetLocation from 'react-native-get-location'
import { envError, noop, successHandle, failHandle } from '../../../common/js'

const getLocation = function(options) {
  const { isHighAccuracy = false, success = noop, fail = noop, complete = noop } = options
  GetLocation.getCurrentPosition({
    enableHighAccuracy: isHighAccuracy
  }).then(location => {
    successHandle(location, success, complete)
  })
  .catch(error => {
    failHandle(error, fail, complete)
  })
}

const openLocation = envError('openLocation')

const chooseLocation = envError('chooseLocation')

export {
  getLocation,
  openLocation,
  chooseLocation
}
