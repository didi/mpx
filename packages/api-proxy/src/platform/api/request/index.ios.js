import { request as requestFun } from './index.web'
import qs from 'qs'
import { Platform } from 'react-native'
const request = function (options) {
  if (parseInt(Platform.Version, 10) >= 17) {
    Object.assign(options, {
      paramsSerializer: (params) =>
        qs.stringify(params, {
          format: 'RFC3986'
        })
    })
  }
  return requestFun(options)
}

export {
  request
}
