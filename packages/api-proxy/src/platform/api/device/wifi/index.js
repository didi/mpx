import { ENV_OBJ, envError } from '../../../../common/js'

const startWifi = ENV_OBJ.startWifi || envError('startWifi')

const stopWifi = ENV_OBJ.stopWifi || envError('stopWifi')

const getWifiList = ENV_OBJ.getWifiList || envError('getWifiList')

const getConnectedWifi = ENV_OBJ.getConnectedWifi || envError('getConnectedWifi')

const onGetWifiList = ENV_OBJ.onGetWifiList || envError('onGetWifiList')

const offGetWifiList = ENV_OBJ.offGetWifiList || envError('offGetWifiList')

export {
  startWifi,
  stopWifi,
  getWifiList,
  onGetWifiList,
  offGetWifiList,
  getConnectedWifi
}