import { getFocusedNavigation, hasOwn } from '@mpxjs/utils'
import { Dimensions } from 'react-native'
import Mpx from '../index'

let dimensionsBase
let dimensionsInfo
let styleDimensionsSnapshot
let applyingCustomDimensions = false

function assertNotApplyingCustomDimensions () {
  if (applyingCustomDimensions) {
    throw new Error('Do not call getDimensionsInfo, getWindowInfo, getSystemInfo, or other APIs that depend on customDimensions results inside rnConfig.customDimensions.')
  }
}

function cloneDimensionsInfo (dimensions) {
  return {
    window: Object.assign({}, dimensions.window),
    screen: Object.assign({}, dimensions.screen)
  }
}

export function getDimensionsBase () {
  if (!dimensionsBase) {
    dimensionsBase = Mpx.config.rnConfig?.dimensionsBase === 'screen' ? 'screen' : 'window'
  }
  return dimensionsBase
}

function getStyleDimensionsSnapshot (dimensionsBase, dimensions) {
  const baseDimensions = dimensions[dimensionsBase]
  return `${baseDimensions.width}x${baseDimensions.height}`
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

export function syncDimensions (dimensions) {
  const customDimensions = Mpx.config.rnConfig?.customDimensions
  const currentDimensionsBase = getDimensionsBase()
  dimensions = cloneDimensionsInfo(dimensions)
  if (typeof customDimensions === 'function') {
    applyingCustomDimensions = true
    try {
      dimensions = cloneDimensionsInfo(customDimensions(dimensions) || dimensions)
    } finally {
      applyingCustomDimensions = false
    }
  }
  const nextStyleDimensionsSnapshot = getStyleDimensionsSnapshot(currentDimensionsBase, dimensions)
  const styleDimensionsChanged = styleDimensionsSnapshot !== undefined && styleDimensionsSnapshot !== nextStyleDimensionsSnapshot

  // 自定义尺寸计算成功后再统一提交，避免中途异常留下部分更新状态。
  dimensionsInfo = dimensions
  styleDimensionsSnapshot = nextStyleDimensionsSnapshot

  if (styleDimensionsChanged) {
    triggerStyleDimensionsChange()
  }
}

export function getDimensionsInfo (base) {
  assertNotApplyingCustomDimensions()
  if (styleDimensionsSnapshot === undefined) {
    syncDimensions({
      window: Dimensions.get('window'),
      screen: Dimensions.get('screen')
    })
  }
  return dimensionsInfo[base || getDimensionsBase()]
}
