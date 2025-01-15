import { successHandle, failHandle, defineUnsupportedProps } from '../../../../common/js'
import NetInfo, { NetInfoStateType } from '@react-native-community/netinfo'

let _unsubscribe = null
const _callbacks = new Set()
const getConnectionType = function (connectionInfo) {
  let type = 'unknown'
  if (connectionInfo.type === NetInfoStateType.cellular && connectionInfo.details.cellularGeneration) {
    type = connectionInfo.details.cellularGeneration
  } else if (connectionInfo.type === NetInfoStateType.wifi || connectionInfo.type === NetInfoStateType.none) {
    type = connectionInfo.type
  }
  return type
}

const getNetworkType = function (options = {}) {
  const { success, fail, complete } = options
  NetInfo.fetch().then((connectionInfo) => {
    const result = {
      networkType: getConnectionType(connectionInfo),
      errMsg: 'getNetworkType:ok'
    }
    defineUnsupportedProps(result, ['signalStrength', 'hasSystemProxy'])
    successHandle(result, success, complete)
  }).catch((err) => {
    const result = {
      errMsg: err.message
    }
    failHandle(result, fail, complete)
  })
}

const onNetworkStatusChange = function (callback) {
  _callbacks.add(callback)
  if (!_unsubscribe) {
    _unsubscribe = NetInfo.addEventListener((connectionInfo) => {
      _callbacks.forEach(cb => {
        const { isConnected } = connectionInfo
        // eslint-disable-next-line node/no-callback-literal
        cb && cb({ isConnected, networkType: getConnectionType(connectionInfo) })
      })
    })
  }
}
const offNetworkStatusChange = function (callback) {
  if (callback && typeof callback === 'function') {
    _callbacks.delete(callback)
  } else if (callback === undefined) {
    _callbacks.clear()
    _unsubscribe && _unsubscribe()
    _unsubscribe = null
  }
}

export {
  getNetworkType,
  offNetworkStatusChange,
  onNetworkStatusChange
}
