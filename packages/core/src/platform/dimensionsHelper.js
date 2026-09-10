import { ONRESIZE } from '../core/innerLifecycle'
import Mpx from '../index'

export function getDimensionsBase () {
  return Mpx.config.rnConfig?.dimensionsBase === 'screen' ? 'screen' : 'window'
}

export function getSystemInfo () {
  const windowDimensions = global.__mpxAppDimensionsInfo.window
  const screenDimensions = global.__mpxAppDimensionsInfo.screen
  const baseDimensions = global.__mpxAppDimensionsInfo[getDimensionsBase()]
  return {
    deviceOrientation: baseDimensions.width > baseDimensions.height ? 'landscape' : 'portrait',
    size: {
      screenWidth: screenDimensions.width,
      screenHeight: screenDimensions.height,
      windowWidth: windowDimensions.width,
      windowHeight: windowDimensions.height
    }
  }
}

export function triggerResizeEvent (mpxProxy, sizeRef) {
  const oldSize = sizeRef.current.size
  const systemInfo = getSystemInfo()
  const newSize = systemInfo.size
  const dimensionsBase = getDimensionsBase()
  const widthKey = `${dimensionsBase}Width`
  const heightKey = `${dimensionsBase}Height`

  if (oldSize && oldSize[widthKey] === newSize[widthKey] && oldSize[heightKey] === newSize[heightKey]) {
    return
  }

  Object.assign(sizeRef.current, systemInfo)

  const type = mpxProxy.options.__type__
  const target = mpxProxy.target
  mpxProxy.callHook(ONRESIZE, [systemInfo])
  if (type === 'page') {
    target.onResize && target.onResize(systemInfo)
  } else {
    const pageLifetimes = mpxProxy.options.pageLifetimes
    pageLifetimes && typeof pageLifetimes.resize === 'function' && pageLifetimes.resize.call(target, systemInfo)
  }
}
