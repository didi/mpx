import WifiManager from 'react-native-wifi-reborn'
import { PermissionsAndroid } from 'react-native'
import { noop } from '@mpxjs/utils'
let startWifiReady = false
let wifiListListeners = []

async function requestWifiPermission() {
  const granted = await PermissionsAndroid.request( PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION, {
    title: 'Location permission is required for WiFi connections',
    message:
      'This app needs location permission as this is required  ' +
      'to scan for wifi networks.',
    buttonNegative: 'DENY',
    buttonPositive: 'ALLOW',
  })
  if (granted === PermissionsAndroid.RESULTS.GRANTED) {
    return true
  } else {
    return false
  }
}

function startWifi (options = {}) {
  const { success = noop, fail = noop, complete = noop } = options
  if (__mpx_mode__ === 'ios') {
    const result = {
      errMsg: 'startWifi:fail ios system not support, you need to manually go to the Settings to enable wifi'
    }
    fail(result)
    complete(result)
    return
  }
  startWifiReady = true
  requestWifiPermission().then(async () => {
    let enabled
    try {
      enabled = await WifiManager.isEnabled()
    } catch (e) {
      enabled = false
    }
    const result = {
      errMsg: 'startWifi:success'
    }
    if (!enabled) {
      WifiManager.setEnabled(true)
      success(result)
      complete(result)
    } else {
      success(result)
      complete(result)
    }
  })
}

function stopWifi (options = {}) {
  const { success = noop, fail = noop, complete = noop } = options
  if (__mpx_mode__ === 'ios') {
    const result = {
      errMsg: 'startWifi:fail ios system not support, you need to manually go to the Settings to enable wifi'
    }
    fail(result)
    complete(result)
    return
  }
  WifiManager.setEnabled(false)
  const result = {
    errMsg: 'stopWifi:success'
  }
  success(result)
  complete(result)
}

function getWifiList (options = {}) {
  const { success = noop, fail = noop, complete = noop } = options
  if (__mpx_mode__ === 'ios') {
    const result = {
      errMsg: 'startWifi:fail ios system not support'
    }
    fail(result)
    complete(result)
    return
  }
  if (!startWifiReady) {
    const result = {
      errMsg: 'startWifi:fail not init startWifi',
      errCode: 12000
    }
    fail(result)
    complete(result)
    return
  }
  WifiManager.loadWifiList().then((res) => {
    if (wifiListListeners.length) {
      const result = res.map(item => {
        return {
          SSID: item.SSID,
          BSSID: item.BSSID,
          frequency: item.frequency
        }
      })
      wifiListListeners.forEach(callback => {
        callback({ wifiList: result })
      })
    }    
    const result = {
      errMsg: 'getWifiList:success',
      errno: 0,
      errCode: 0
    }
    success(result)
    complete(result)
  }).catch(() => {
    const result = {
      errMsg: 'getWifiList:fail'
    }
    fail(result)
    complete(result)
  })
}

function onGetWifiList (callback) {
   if (!startWifiReady && wifiListListeners.indexOf(callback) > -1) {
    return
  }
  wifiListListeners.push(callback)
}

function offGetWifiList (callback) {
  if (!startWifiReady) {
    return
  }
  const index = wifiListListeners.indexOf(callback)
  if (index > -1) {
    wifiListListeners.splice(index, 1)
  }
}

function getConnectedWifi (options = {}) {
  const { partialInfo = false, success = noop, fail = noop, complete = noop } = options
    
  if (!startWifiReady) {
    const result = {
      errMsg: 'getConnectedWifi:fail not init',
      errCode: 12000
    }
    fail(result)
    complete(result)
    return
  }

  if (partialInfo) {
    WifiManager.getCurrentWifiSSID().then((res) => {
      const wifi = {
        SSID: res,
        BSSID: '', // iOS无法获取BSSID
        signalStrength: 0,
        frequency: 0
      }
      const result = {
        wifi: wifi,
        errMsg: 'getConnectedWifi:ok'
      }
      success(result)
      complete(result)
    }).catch((error) => {
      console.log(error)
      const result = {
        errMsg: 'getConnectedWifi:fail'
      }
      fail(result)
      complete(result)
    })
  } else {
    Promise.all([
      WifiManager.getCurrentWifiSSID().catch(() => null),
      WifiManager.getBSSID().catch(() => ''),
      WifiManager.getCurrentSignalStrength().catch(() => 0),
      WifiManager.getFrequency().catch(() => 0)
    ]).then(([ssid, bssid, signalStrength, frequency]) => {
      if (!ssid) {
        const result = {
          errMsg: 'getConnectedWifi:fail'
        }
        fail(result)
        complete(result)
        return
      }
      
      const wifi = {
        SSID: ssid,
        BSSID: bssid,
        signalStrength: signalStrength,
        frequency: frequency
      }
      
      const result = {
        wifi: wifi,
        errMsg: 'getConnectedWifi:ok'
      }
      success(result)
      complete(result)
    }).catch((error) => {
      console.log(error, '--error')
      const result = {
        errMsg: 'getConnectedWifi:fail'
      }
      fail(result)
      complete(result)
    })
  }
}

export {
  startWifi,
  stopWifi,
  getWifiList,
  onGetWifiList,
  offGetWifiList,
  getConnectedWifi
}