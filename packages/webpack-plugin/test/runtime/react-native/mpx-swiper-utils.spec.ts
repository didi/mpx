/// <reference types="jest" />

import {
  getCircularBoundary,
  getCircularIndex,
  getSwiperMaxIndex,
  getSwiperPatchElmNum,
  getSwiperResistanceOffset,
  getSwiperStep,
  isSwiperDotActive,
  normalizeDisplayMultipleItems,
  normalizeSwiperCurrent
} from '../../../lib/runtime/components/react/mpx-swiper-utils'

describe('MpxSwiper RN runtime calculations', () => {
  test.each([
    [undefined, 1],
    ['3', 3],
    [2.8, 2],
    [0, 1],
    [-2, 1],
    [Infinity, 1],
    ['invalid', 1]
  ])('normalizes display-multiple-items %p to %p', (value, expected) => {
    expect(normalizeDisplayMultipleItems(value)).toBe(expected)
  })

  test('calculates step from the latest size, margins and display count', () => {
    expect(getSwiperStep(300, 10, 20, 3)).toBe(90)
    expect(getSwiperStep(300, 10, 20, 2)).toBe(135)
    expect(getSwiperStep(300, 40, 20, 3)).toBe(80)
    expect(getSwiperStep(0, 10, 20, 3)).toBe(0)
  })

  test('clamps current to the last complete non-circular viewport', () => {
    expect(getSwiperMaxIndex(5, 3, false)).toBe(2)
    expect(normalizeSwiperCurrent('4', 5, 3, false)).toBe(2)
    expect(normalizeSwiperCurrent(-1, 5, 3, false)).toBe(0)
    expect(normalizeSwiperCurrent(1.8, 5, 3, false)).toBe(1)
    expect(normalizeSwiperCurrent(Infinity, 5, 3, false)).toBe(0)
  })

  test('keeps every child reachable in circular mode', () => {
    expect(getSwiperMaxIndex(5, 3, true)).toBe(4)
    expect(normalizeSwiperCurrent(4, 5, 3, true)).toBe(4)
    expect(getCircularIndex(-1, 5)).toBe(4)
    expect(getCircularIndex(5, 5)).toBe(0)
  })

  test('activates every visible item dot in non-circular mode', () => {
    expect([0, 1, 2, 3, 4].map(index => isSwiperDotActive(index, 0, 3, 5, false))).toEqual([
      true,
      true,
      true,
      false,
      false
    ])
    expect([0, 1, 2, 3, 4].map(index => isSwiperDotActive(index, 2, 3, 5, false))).toEqual([
      false,
      false,
      true,
      true,
      true
    ])
  })

  test('wraps active item dots in circular mode', () => {
    expect([0, 1, 2, 3, 4].map(index => isSwiperDotActive(index, 4, 2, 5, true))).toEqual([
      true,
      false,
      false,
      false,
      true
    ])
  })

  test('renders enough circular clones to cover the viewport', () => {
    expect(getSwiperPatchElmNum(true, 5, 2, true, 300, 80)).toBe(4)
    expect(getSwiperPatchElmNum(true, 5, 2, false, 300, 150)).toBe(2)
    expect(getSwiperPatchElmNum(false, 5, 2, true, 300, 80)).toBe(0)
  })

  test('wraps circular offsets by exactly one children cycle', () => {
    expect(getCircularBoundary(10, 5, 3, 100, 300)).toEqual({
      isBoundary: true,
      resetOffset: -490
    })
    expect(getCircularBoundary(-810, 5, 3, 100, 300)).toEqual({
      isBoundary: true,
      resetOffset: -310
    })
    expect(getCircularBoundary(-1810, 5, 3, 100, 300)).toEqual({
      isBoundary: true,
      resetOffset: -310
    })
  })

  test('wraps before large edge margins exhaust the circular clones', () => {
    expect(getCircularBoundary(-590, 5, 3, 80, 300)).toEqual({
      isBoundary: true,
      resetOffset: -190
    })
  })

  test('keeps over-drag resistance finite and in the drag direction', () => {
    expect(getSwiperResistanceOffset(0, -100, -100, 0, 100)).toBe(-10)
    expect(getSwiperResistanceOffset(0, -1, -1, 0, 1)).toBe(-0.1)
    expect(getSwiperResistanceOffset(0, 100, 100, 0, 100)).toBe(10)
  })
})
