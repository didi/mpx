const fs = require('fs')
const path = require('path')
const vm = require('vm')
const ts = require('typescript')

const helperNames = [
  'normalizeDisplayMultipleItems',
  'getSwiperMaxIndex',
  'normalizeSwiperCurrent',
  'getSwiperStep',
  'getSwiperPatchElmNum',
  'getCircularIndex',
  'isSwiperDotActive',
  'getCircularBoundary',
  'getSwiperPositionOffset'
]

function loadSwiperHelpers () {
  const componentPath = path.resolve(__dirname, '../../../lib/runtime/components/react/mpx-swiper.tsx')
  const source = fs.readFileSync(componentPath, 'utf8')
  // 在内存中追加测试导出，避免为了测试改变组件的生产接口或拆分实现文件
  const output = ts.transpileModule(`${source}\nmodule.exports.__test__ = { ${helperNames.join(', ')} }`, {
    compilerOptions: {
      jsx: ts.JsxEmit.React,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2018
    }
  }).outputText
  const runtimeModule = { exports: {} }
  const easing = value => value
  const modules = {
    react: {
      default: { createElement: () => null },
      forwardRef: component => component
    },
    'react-native': {},
    'react-native-gesture-handler': {},
    'react-native-reanimated': {
      default: {},
      Easing: {
        cubic: () => null,
        linear: () => null,
        in: easing,
        out: easing,
        inOut: easing
      }
    },
    './getInnerListeners': {},
    './useNodesRef': {},
    './utils': {},
    './context': {},
    './mpx-portal': {}
  }
  const loadModule = (request) => {
    if (!Object.prototype.hasOwnProperty.call(modules, request)) {
      throw new Error(`Unexpected swiper dependency: ${request}`)
    }
    return modules[request]
  }

  vm.runInNewContext(output, {
    module: runtimeModule,
    exports: runtimeModule.exports,
    require: loadModule
  })
  return runtimeModule.exports.__test__
}

const {
  getCircularBoundary,
  getCircularIndex,
  getSwiperMaxIndex,
  getSwiperPatchElmNum,
  getSwiperPositionOffset,
  getSwiperStep,
  isSwiperDotActive,
  normalizeDisplayMultipleItems,
  normalizeSwiperCurrent
} = loadSwiperHelpers()

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

  test('normalizes circular offsets against previous margin', () => {
    expect(getSwiperPositionOffset(-200, true, 100)).toBe(300)
    expect(getSwiperPositionOffset(-199, true, 100)).toBe(299)
    expect(getSwiperPositionOffset(-201, true, 100)).toBe(301)
    expect(getSwiperPositionOffset(-200, false, 100)).toBe(200)
  })
})
