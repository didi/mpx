import { ONRESIZE } from '../core/innerLifecycle'
import { getFocusedNavigation, hasOwn } from '@mpxjs/utils'
import Mpx from '../index'

let dimensionsInfoInitialized = false
let rawDimensionsInfo
let appliedDimensionsBase
let styleDimensionsSnapshot
let applyingCustomDimensions = false

function assertNotApplyingCustomDimensions () {
  if (applyingCustomDimensions) {
    throw new Error('Do not call getWindowInfo, getSystemInfo, or other APIs that depend on customDimensions results inside rnConfig.customDimensions.')
  }
}

function cloneDimensionsInfo (dimensions) {
  return {
    window: Object.assign({}, dimensions.window),
    screen: Object.assign({}, dimensions.screen)
  }
}

function getConfiguredDimensionsBase () {
  return Mpx.config.rnConfig?.dimensionsBase === 'screen' ? 'screen' : 'window'
}

export function getDimensionsBase () {
  return dimensionsInfoInitialized ? appliedDimensionsBase : getConfiguredDimensionsBase()
}

export function initDimensionsInfo (dimensions) {
  dimensionsInfoInitialized = false
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
  assertNotApplyingCustomDimensions()
  const oldStyleDimensionsSnapshot = styleDimensionsSnapshot
  const nextRawDimensionsInfo = cloneDimensionsInfo(dimensions)
  const customDimensions = Mpx.config.rnConfig?.customDimensions
  const dimensionsBase = getConfiguredDimensionsBase()
  dimensions = cloneDimensionsInfo(nextRawDimensionsInfo)
  if (typeof customDimensions === 'function') {
    applyingCustomDimensions = true
    try {
      dimensions = customDimensions(dimensions) || dimensions
    } finally {
      applyingCustomDimensions = false
    }
  }
  dimensions = cloneDimensionsInfo(dimensions)
  const nextStyleDimensionsSnapshot = getStyleDimensionsSnapshot(dimensionsBase, dimensions)

  // 自定义尺寸计算成功后再统一提交，避免中途异常留下部分更新状态。
  rawDimensionsInfo = nextRawDimensionsInfo
  dimensionsInfoInitialized = true
  appliedDimensionsBase = dimensionsBase
  global.__mpxAppDimensionsInfo.window = dimensions.window
  global.__mpxAppDimensionsInfo.screen = dimensions.screen
  styleDimensionsSnapshot = nextStyleDimensionsSnapshot

  if (!options.silent && oldStyleDimensionsSnapshot && !isSameStyleDimensions(oldStyleDimensionsSnapshot, styleDimensionsSnapshot)) {
    triggerStyleDimensionsChange()
  }
}

export function getStyleDimensions (dimensionsBase) {
  assertNotApplyingCustomDimensions()
  if (!dimensionsInfoInitialized) {
    syncDimensions(rawDimensionsInfo, { silent: true })
  }
  return global.__mpxAppDimensionsInfo[dimensionsBase || appliedDimensionsBase]
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
  const oldDimensionsBase = sizeRef.current.dimensionsBase || dimensionsBase
  const widthKey = `${dimensionsBase}Width`
  const heightKey = `${dimensionsBase}Height`

  if (oldDimensionsBase === dimensionsBase && oldSize && oldSize[widthKey] === newSize[widthKey] && oldSize[heightKey] === newSize[heightKey]) {
    return
  }

  Object.assign(sizeRef.current, systemInfo, { dimensionsBase })

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
