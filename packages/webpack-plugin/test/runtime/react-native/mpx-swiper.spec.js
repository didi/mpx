const fs = require('fs')
const path = require('path')
const vm = require('vm')
const ts = require('typescript')

const componentPath = path.resolve(__dirname, '../../../lib/runtime/components/react/mpx-swiper.tsx')
const compiled = ts.transpileModule(fs.readFileSync(componentPath, 'utf8'), {
  compilerOptions: { jsx: ts.JsxEmit.React, module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2018 }
}).outputText

// 直接执行组件源码，模拟本组测试所需的同步渲染、SharedValue 和 effect。
function createSwiper () {
  const slots = []
  let cursor = 0
  let effects = []
  const useRef = (current) => {
    const index = cursor++
    if (!slots[index]) slots[index] = { current }
    return slots[index]
  }
  const useMemo = (factory, deps) => {
    const ref = useRef()
    if (!ref.current || deps.some((value, index) => !Object.is(value, ref.current.deps[index]))) {
      ref.current = { value: factory(), deps }
    }
    return ref.current.value
  }
  const createElement = (type, props, ...children) => {
    props = Object.assign({}, props, { children: children.flat() })
    return typeof type === 'function' ? type(props) : { type, props }
  }
  const react = {
    createElement,
    cloneElement: (child, props) => Object.assign({}, child, { props: Object.assign({}, child.props, props) }),
    forwardRef: component => component,
    useRef,
    useMemo,
    useEffect: (callback, deps) => useMemo(() => effects.push(callback), deps)
  }
  const gesture = new Proxy({}, { get: () => () => gesture })
  const easing = value => value
  const modules = {
    react: Object.assign({ default: react }, react),
    'react-native': { View: 'View' },
    'react-native-gesture-handler': { Gesture: { Pan: () => gesture } },
    'react-native-reanimated': {
      default: { View: 'AnimatedView' },
      useSharedValue: value => useRef({ value }).current,
      useAnimatedStyle: callback => callback(),
      useAnimatedReaction: () => {},
      withTiming: (value, options, callback) => {
        if (callback) callback(true)
        return value
      },
      Easing: { cubic: easing, linear: easing, in: easing, out: easing, inOut: easing }
    },
    './getInnerListeners': { default: () => ({}) },
    './useNodesRef': { default: () => {} },
    './utils': {
      useTransformStyle: style => ({ normalStyle: style, varContextRef: { current: {} } }),
      splitStyle: () => ({}),
      splitProps: () => ({}),
      useLayout: ({ onLayout }) => ({ layoutProps: { onLayout } }),
      wrapChildren: ({ children }) => children,
      extendObject: Object.assign,
      flatGesture: value => value,
      useRunOnJSCallback: () => () => {}
    },
    './context': { SwiperContext: { Provider: 'SwiperContext' } },
    './mpx-portal': {}
  }
  const runtimeModule = { exports: {} }
  vm.runInNewContext(compiled, {
    module: runtimeModule,
    exports: runtimeModule.exports,
    global: { __formatValue: parseFloat },
    require: request => {
      if (!Object.prototype.hasOwnProperty.call(modules, request)) throw new Error(request)
      return modules[request]
    }
  }, { filename: componentPath })

  return (props = {}) => {
    cursor = 0
    effects = []
    const tree = runtimeModule.exports.default(Object.assign({
      style: { width: 300, height: 240 },
      children: Array.from({ length: 5 }, (_, key) => ({ key, props: {} })),
      disableGesture: true,
      'indicator-dots': true,
      'indicator-color': 'gray',
      'indicator-active-color': 'black'
    }, props))
    effects.forEach(callback => callback())
    const items = tree.props.children[0].props.children[0]
    const dots = tree.props.children[1].props.children[0].props.children
    return { tree, items, dots }
  }
}

describe('swiper display-multiple-items', () => {
  test('keeps the default single-item layout', () => {
    const { items, dots } = createSwiper()()
    expect(items.props.value.step.value).toBe(300)
    expect(dots.map(dot => dot.props.style[1].backgroundColor)).toEqual(['black', 'gray', 'gray', 'gray', 'gray'])
  })

  test('converts the static string count before generating circular clones', () => {
    const { items } = createSwiper()({ circular: true, 'display-multiple-items': '3' })
    expect(items.props.value.step.value).toBe(100)
    expect(items.props.children).toHaveLength(13)
  })

  test.each([false, true])('updates item size when display count changes, vertical=%p', (vertical) => {
    const render = createSwiper()
    const first = render({ vertical, current: 1, 'display-multiple-items': 2 })
    expect(first.items.props.value.step.value).toBe(vertical ? 120 : 150)
    const next = render({ vertical, current: 1, 'display-multiple-items': 3 })
    expect(next.items.props.value.step.value).toBe(vertical ? 80 : 100)
    expect(next.items.props.value.offset.value).toBe(vertical ? -80 : -100)
  })

  test('clamps the initial and updated current to the last complete viewport', () => {
    const render = createSwiper()
    const props = { current: 4, 'display-multiple-items': 3 }
    expect(render(props).items.props.value.offset.value).toBe(-200)
    render({ current: 0, 'display-multiple-items': 3 })
    expect(render(props).items.props.value.offset.value).toBe(-200)
    expect(render(props).dots.map(dot => dot.props.style[1].backgroundColor)).toEqual(['gray', 'gray', 'black', 'black', 'black'])
  })

  test.each([false, true])('clamps the current when the display count increases, vertical=%p', (vertical) => {
    const render = createSwiper()
    render({ vertical, current: 4, 'display-multiple-items': 1 })
    const props = { vertical, current: 4, 'display-multiple-items': 3 }
    const next = render(props)
    expect(next.items.props.value.step.value).toBe(vertical ? 80 : 100)
    expect(next.items.props.value.offset.value).toBe(vertical ? -160 : -200)
    expect(render(props).dots.map(dot => dot.props.style[1].backgroundColor)).toEqual(['gray', 'gray', 'black', 'black', 'black'])
  })

  test('updates display count after measuring a percentage-sized swiper', () => {
    const render = createSwiper()
    const first = render({ style: { width: '100%' }, 'display-multiple-items': 2 })
    first.tree.props.onLayout({ nativeEvent: { layout: { width: 300, height: 240 } } })
    expect(first.items.props.value.step.value).toBe(150)
    const next = render({ style: { width: '100%' }, 'display-multiple-items': 3 })
    expect(next.items.props.value.step.value).toBe(100)
  })

  test('scales margin changes by the current display count', () => {
    const render = createSwiper()
    render({ 'display-multiple-items': 2, 'previous-margin': '10px', 'next-margin': '20px' })
    const next = render({ 'display-multiple-items': 3, 'previous-margin': '40px', 'next-margin': '20px' })
    expect(next.items.props.value.step.value).toBe(80)
  })

  test.each([
    [false, 2, ['gray', 'gray', 'black', 'black', 'black']],
    [true, 4, ['black', 'black', 'gray', 'gray', 'black']]
  ])('highlights three of the five dots, circular=%p', (circular, current, colors) => {
    const { dots } = createSwiper()({ circular, current, 'display-multiple-items': 3 })
    expect(dots).toHaveLength(5)
    expect(dots.map(dot => dot.props.style[1].backgroundColor)).toEqual(colors)
  })
})
