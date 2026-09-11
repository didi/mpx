import { ONRESIZE } from '../core/innerLifecycle'
import Mpx from '../index'

let dimensionsInfoInitialized = false
let rawDimensionsInfo
let appliedCustomDimensions

function cloneDimensionsInfo (dimensions) {
  return {
    window: Object.assign({}, dimensions.window),
    screen: Object.assign({}, dimensions.screen)
  }
}

export function getDimensionsBase () {
  return Mpx.config.rnConfig?.dimensionsBase === 'screen' ? 'screen' : 'window'
}

export function initDimensionsInfo (dimensions) {
  dimensionsInfoInitialized = false
  appliedCustomDimensions = undefined
  rawDimensionsInfo = cloneDimensionsInfo(dimensions)
  global.__mpxAppDimensionsInfo = cloneDimensionsInfo(rawDimensionsInfo)
}

export function applyDimensionsInfo (dimensions) {
  rawDimensionsInfo = cloneDimensionsInfo(dimensions)
  const customDimensions = Mpx.config.rnConfig?.customDimensions
  dimensionsInfoInitialized = true
  appliedCustomDimensions = customDimensions
  dimensions = cloneDimensionsInfo(rawDimensionsInfo)
  if (typeof customDimensions === 'function') {
    dimensions = customDimensions(dimensions) || dimensions
  }
  global.__mpxAppDimensionsInfo.window = dimensions.window
  global.__mpxAppDimensionsInfo.screen = dimensions.screen
}

export function getStyleDimensions (dimensionsBase = getDimensionsBase()) {
  if (!dimensionsInfoInitialized || appliedCustomDimensions !== Mpx.config.rnConfig?.customDimensions) {
    applyDimensionsInfo(rawDimensionsInfo)
  }
  return global.__mpxAppDimensionsInfo[dimensionsBase]
}

export function getSystemInfo () {
  const baseDimensions = getStyleDimensions()
  const windowDimensions = global.__mpxAppDimensionsInfo.window
  const screenDimensions = global.__mpxAppDimensionsInfo.screen
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
