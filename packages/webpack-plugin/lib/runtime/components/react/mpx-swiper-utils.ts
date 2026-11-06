export function normalizeDisplayMultipleItems (value: number | string | undefined) {
  const displayMultipleItems = Math.floor(Number(value))
  return Number.isFinite(displayMultipleItems) ? Math.max(1, displayMultipleItems) : 1
}

export function getSwiperMaxIndex (childrenLength: number, displayMultipleItems: number, circular: boolean) {
  'worklet'
  return Math.max(0, childrenLength - (circular ? 1 : displayMultipleItems))
}

export function normalizeSwiperCurrent (
  current: number | string,
  childrenLength: number,
  displayMultipleItems: number,
  circular: boolean
) {
  const currentIndex = Math.floor(Number(current))
  if (!Number.isFinite(currentIndex)) return 0
  return Math.min(Math.max(0, currentIndex), getSwiperMaxIndex(childrenLength, displayMultipleItems, circular))
}

export function getSwiperStep (
  mainAxisSize: number,
  previousMargin: number,
  nextMargin: number,
  displayMultipleItems: number
) {
  const step = (mainAxisSize - previousMargin - nextMargin) / displayMultipleItems
  return Number.isFinite(step) && step > 0 ? step : 0
}

export function getSwiperPatchElmNum (
  circular: boolean,
  childrenLength: number,
  displayMultipleItems: number,
  hasEdgeMargin: boolean,
  viewportSize: number,
  step: number
) {
  if (!circular || childrenLength <= 1) return 0
  const basePatchElmNum = displayMultipleItems + (hasEdgeMargin ? 1 : 0)
  const viewportItemCount = Math.ceil(viewportSize / step)
  return Number.isFinite(viewportItemCount)
    ? Math.max(basePatchElmNum, viewportItemCount)
    : basePatchElmNum
}

export function getCircularIndex (index: number, childrenLength: number) {
  'worklet'
  if (!childrenLength) return 0
  return ((index % childrenLength) + childrenLength) % childrenLength
}

export function isSwiperDotActive (
  dotIndex: number,
  currentIndex: number,
  displayMultipleItems: number,
  childrenLength: number,
  circular: boolean
) {
  'worklet'
  if (dotIndex < 0 || dotIndex >= childrenLength) return false
  const activeDotCount = Math.min(displayMultipleItems, childrenLength)
  if (!circular) return dotIndex >= currentIndex && dotIndex < currentIndex + activeDotCount
  return getCircularIndex(dotIndex - currentIndex, childrenLength) < activeDotCount
}

export function getCircularBoundary (
  moveToOffset: number,
  childrenLength: number,
  patchElmNum: number,
  step: number,
  viewportSize: number
) {
  'worklet'
  if (childrenLength <= 0 || step <= 0) {
    return {
      isBoundary: false,
      resetOffset: 0
    }
  }
  const boundaryStart = 0
  const boundaryEnd = Math.max(
    -(childrenLength + patchElmNum) * step,
    -((childrenLength + patchElmNum * 2) * step - viewportSize)
  )
  const cycleSize = childrenLength * step
  if (moveToOffset < boundaryEnd) {
    return {
      isBoundary: true,
      resetOffset: moveToOffset + Math.ceil((boundaryEnd - moveToOffset) / cycleSize) * cycleSize
    }
  }
  if (moveToOffset > boundaryStart) {
    return {
      isBoundary: true,
      resetOffset: moveToOffset - Math.ceil((moveToOffset - boundaryStart) / cycleSize) * cycleSize
    }
  }
  return {
    isBoundary: false,
    resetOffset: 0
  }
}

export function getSwiperResistanceOffset (
  offset: number,
  translation: number,
  transdir: number,
  maxOffset: number,
  step: number
) {
  'worklet'
  const moveToOffset = offset + translation
  const maxOverDrag = step / 2
  const overDrag = transdir < 0 ? Math.abs(moveToOffset - maxOffset) : Math.abs(moveToOffset)
  const resistance = Math.max(0.1, Math.min(0.5, 1 - overDrag / maxOverDrag))
  const adjustOffset = offset + translation * resistance
  return transdir < 0
    ? Math.max(adjustOffset, maxOffset - maxOverDrag)
    : Math.min(adjustOffset, maxOverDrag)
}
