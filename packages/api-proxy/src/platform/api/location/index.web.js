import { envError, noop, successHandle, failHandle } from '../../../common/js'

const getLocation = function(options) {
  const { isHighAccuracy = false, success = noop, fail = noop, complete = noop } = options
  if (navigator.geolocation.getCurrentPosition) {
    navigator.geolocation.getCurrentPosition((res) => {
      successHandle(res, success, complete)
    }, (err) => {
      failHandle(err, fail, complete)
    }, {
      enableHighAccuracy: isHighAccuracy
    })
  }
}

const openLocation = envError('openLocation')

const chooseLocation = envError('chooseLocation')

export {
  getLocation,
  openLocation,
  chooseLocation
}
