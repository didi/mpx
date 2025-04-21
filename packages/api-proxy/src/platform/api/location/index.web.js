import { envError, successHandle, failHandle, defineUnsupportedProps } from '../../../common/js'

const getLocation = function (options = {}) {
  const { isHighAccuracy = false, success, fail, complete } = options
  if (navigator.geolocation.getCurrentPosition) {
    navigator.geolocation.getCurrentPosition((res = {}) => {
      const coords = res.coords || {}
      const result = {
        accuracy: coords.accuracy,
        errMsg: 'getLocation:ok',
        latitude: coords.latitude,
        longitude: coords.longitude,
        speed: coords.accuracy
      }
      defineUnsupportedProps(result, ['horizontalAccuracy', 'verticalAccuracy'])
      successHandle(result, success, complete)
    }, (err) => {
      const result = {
        errMsg: `getLocation:fail ${err}`
      }
      failHandle(result, fail, complete)
    }, {
      enableHighAccuracy: isHighAccuracy
    })
  }
}

const openLocation = envError('openLocation')

const chooseLocation = envError('chooseLocation')

const startLocationUpdate = envError('startLocationUpdate')

const stopLocationUpdate = envError('stopLocationUpdate')

export {
  getLocation,
  openLocation,
  chooseLocation,
  startLocationUpdate,
  stopLocationUpdate
}
