import { ONRESIZE } from '../core/innerLifecycle'
import { getFocusedNavigation, hasOwn } from '@mpxjs/utils'
import Mpx from '../index'

let dimensionsInfoInitialized = false
let rawDimensionsInfo
let appliedCustomDimensions
let appliedDimensionsBase
let styleDimensionsSnapshot

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
  appliedDimensionsBase = undefined
  styleDimensionsSnapshot = undefined
  rawDimensionsInfo = cloneDimensionsInfo(dimensions)
  global.__mpxAppDimensionsInfo = cloneDimensionsInfo(rawDimensionsInfo)
}

function getStyleDimensionsSnapshot (dimensionsBase, dimensions) {
  const baseDimensions = dimensions[dimensionsBase]
  return {
    dimensionsBase,
    width: baseDimensions.width,
    height: baseDimensions.height
  }
}

function isSameStyleDimensions (a, b) {
  return a.dimensionsBase === b.dimensionsBase &&
    a.width === b.width &&
    a.height === b.height
}

function triggerStyleDimensionsChange () {
  global.__classCaches?.forEach(cache => cache?.clear())
  global.__mpxSizeCount++

  const navigation = getFocusedNavigation()

  if (navigation) {
    global.__mpxPageSizeCountMap[navigation.pageId] = global.__mpxSizeCount
    if (hasOwn(global.__mpxPageStatusMap, navigation.pageId)) {
      global.__mpxPageStatusMap[navigation.pageId] = `resize${global.__mpxSizeCount}`
    }
  }
}

export function syncDimensions (dimensions, options = {}) {
  const oldStyleDimensionsSnapshot = styleDimensionsSnapshot
  rawDimensionsInfo = cloneDimensionsInfo(dimensions)
  const customDimensions = Mpx.config.rnConfig?.customDimensions
  const dimensionsBase = getDimensionsBase()
  dimensionsInfoInitialized = true
  appliedCustomDimensions = customDimensions
  appliedDimensionsBase = dimensionsBase
  dimensions = cloneDimensionsInfo(rawDimensionsInfo)
  if (typeof customDimensions === 'function') {
    dimensions = customDimensions(dimensions) || dimensions
  }
  global.__mpxAppDimensionsInfo.window = dimensions.window
  global.__mpxAppDimensionsInfo.screen = dimensions.screen
  styleDimensionsSnapshot = getStyleDimensionsSnapshot(dimensionsBase, dimensions)

  if (!options.silent && oldStyleDimensionsSnapshot && !isSameStyleDimensions(oldStyleDimensionsSnapshot, styleDimensionsSnapshot)) {
    triggerStyleDimensionsChange()
  }
}

export function getStyleDimensions (dimensionsBase = getDimensionsBase()) {
  if (!dimensionsInfoInitialized) {
    syncDimensions(rawDimensionsInfo, { silent: true })
  } else if (
    appliedDimensionsBase !== getDimensionsBase() ||
    appliedCustomDimensions !== Mpx.config.rnConfig?.customDimensions
  ) {
    syncDimensions(rawDimensionsInfo)
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
