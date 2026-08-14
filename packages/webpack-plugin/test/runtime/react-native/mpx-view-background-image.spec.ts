/// <reference types="jest" />

import React from 'react'
import { act, create, ReactTestRenderer } from 'react-test-renderer'
import { Image as RNImage } from 'react-native'
import MpxView, { __parseBgImageForTest } from '../../../lib/runtime/components/react/mpx-view'

const mockGetSize = RNImage.getSize as jest.Mock

jest.mock('@d11/react-native-fast-image', () => {
  const React = jest.requireActual('react')
  return React.forwardRef((props: any, ref: any) => React.createElement('FastImage', Object.assign({ ref }, props)))
})

jest.mock('react-native-reanimated', () => ({
  __esModule: true,
  default: { View: 'AnimatedView' }
}))

jest.mock('react-native-linear-gradient', () => 'LinearGradient')

jest.mock('react-native-gesture-handler', () => ({
  Gesture: { Tap: () => ({}), Pan: () => ({}), LongPress: () => ({}) },
  GestureDetector: 'GestureDetector'
}))

jest.mock('react-native-safe-area-context', () => ({
  initialWindowMetrics: { insets: { top: 0, right: 0, bottom: 0, left: 0 } }
}))

jest.mock('../../../lib/runtime/components/react/animationHooks/index', () => ({
  __esModule: true,
  default: () => ({ enableStyleAnimation: false })
}))

jest.mock('@mpxjs/perf', () => ({
  scopeStart: () => -1,
  scopeEnd: () => undefined
}))

jest.mock('../../../lib/runtime/components/react/mpx-portal', () => ({
  __esModule: true,
  default: 'Portal'
}))

const layoutEvent = (width: number, height: number) => ({ nativeEvent: { layout: { width, height } } })
const renderView = (style: Record<string, any>) => React.createElement(MpxView, {
  'enable-background': true,
  'enable-fast-image': false,
  style
})
type ConcurrentTestRendererOptions = NonNullable<Parameters<typeof create>[1]> & { unstable_isConcurrent: boolean }
const concurrentOptions: ConcurrentTestRendererOptions = {
  createNodeMock: () => null,
  unstable_isConcurrent: true
}
const concurrentActEnvironment = globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }
concurrentActEnvironment.IS_REACT_ACT_ENVIRONMENT = true

describe('MpxView background image size resolution', () => {
  beforeEach(() => mockGetSize.mockReset())

  test('rejects SVG urls including query/hash forms', () => {
    expect(__parseBgImageForTest('url(https://example.com/a.svg)')).toEqual({})
    expect(__parseBgImageForTest('url("https://example.com/a.svg?x=1#icon")')).toEqual({})
  })

  test('renders fixed bitmap background immediately with stretch and no query', () => {
    let renderer: ReactTestRenderer
    act(() => {
      renderer = create(renderView({
        width: 200,
        height: 100,
        backgroundImage: 'url(https://example.com/a.png)',
        backgroundSize: [120, 60],
        backgroundPosition: ['right', 0, 'top', 0]
      }))
    })

    const image = renderer!.root.findByType('Image')
    expect(image.props.resizeMode).toBe('stretch')
    expect(image.props.style).toMatchObject({ width: 120, height: 60, right: 0, top: 0 })
    expect(image.props.style.opacity).toBeUndefined()
    expect(mockGetSize).not.toHaveBeenCalled()

    act(() => image.props.onLoad({ nativeEvent: { source: { width: 400, height: 200 } } }))
    expect(renderer!.root.findByType('Image').props.style).toMatchObject({ width: 120, height: 60 })
    act(() => renderer!.unmount())
  })

  test('precollects image and layout facts and consumes them after false to true transition', () => {
    let renderer: ReactTestRenderer
    act(() => {
      renderer = create(renderView({
        width: 200,
        height: 100,
        backgroundImage: 'url(https://example.com/a.png)',
        backgroundSize: [120, 60]
      }))
    })
    const views = renderer!.root.findAllByType('View')
    const background = views[1]
    act(() => background.props.onLayout(layoutEvent(200, 100)))
    act(() => renderer!.root.findByType('Image').props.onLoad({ nativeEvent: { source: { width: 400, height: 200 } } }))
    expect(mockGetSize).not.toHaveBeenCalled()

    act(() => {
      renderer!.update(renderView({
        width: 200,
        height: 100,
        backgroundImage: 'url(https://example.com/a.png)',
        backgroundSize: ['cover']
      }))
    })
    expect(mockGetSize).not.toHaveBeenCalled()
    expect(renderer!.root.findByType('Image').props.style).toMatchObject({ width: 200, height: 100 })

    act(() => renderer!.unmount())
  })

  test('keeps the real bitmap mounted while an active query is pending and keeps the first result', () => {
    const callbacks: Array<(width: number, height: number) => void> = []
    mockGetSize.mockImplementation((_src, success) => callbacks.push(success))
    let renderer: ReactTestRenderer
    act(() => {
      renderer = create(renderView({
        width: 200,
        height: 100,
        backgroundImage: 'url(https://example.com/a.png)',
        backgroundSize: ['contain']
      }))
    })

    const image = renderer!.root.findByType('Image')
    expect(image.props.style).toMatchObject({ width: 1, height: 1, opacity: 0 })
    act(() => renderer!.root.findAllByType('View')[1].props.onLayout(layoutEvent(200, 100)))
    act(() => callbacks[0](400, 400))
    expect(renderer!.root.findByType('Image').props.style).toMatchObject({ width: 100, height: 100 })

    act(() => renderer!.root.findByType('Image').props.onLoad({ nativeEvent: { source: { width: 400, height: 200 } } }))
    expect(renderer!.root.findByType('Image').props.style).toMatchObject({ width: 100, height: 100 })
    act(() => renderer!.unmount())
  })

  test.each(['image size', 'layout'] as const)('publishes only after both facts are ready when %s arrives first', (firstFact) => {
    let commits = 0
    const renderProfiledView = () => React.createElement(
      React.Profiler,
      { id: 'view', onRender: () => { commits++ } },
      renderView({
        width: 200,
        height: 100,
        backgroundImage: 'url(https://example.com/a.png)',
        backgroundSize: ['cover']
      })
    )
    let renderer: ReactTestRenderer
    act(() => {
      renderer = create(renderProfiledView())
    })
    const commitsAfterMount = commits
    const commitImageSize = () => renderer!.root.findByType('Image').props.onLoad({ nativeEvent: { source: { width: 400, height: 200 } } })
    const commitLayout = () => renderer!.root.findAllByType('View')[1].props.onLayout(layoutEvent(200, 100))

    act(firstFact === 'image size' ? commitImageSize : commitLayout)
    expect(commits).toBe(commitsAfterMount)
    act(firstFact === 'image size' ? commitLayout : commitImageSize)
    expect(commits).toBe(commitsAfterMount + 1)
    expect(renderer!.root.findByType('Image').props.style).toMatchObject({ width: 200, height: 100 })
    act(() => renderer!.unmount())
  })

  test.each([
    [200, 0],
    [0, 100]
  ])('accepts zero background layout size (%s, %s)', (layoutWidth, layoutHeight) => {
    let renderer: ReactTestRenderer
    act(() => {
      renderer = create(renderView({
        width: layoutWidth,
        height: layoutHeight,
        backgroundImage: 'url(https://example.com/a.png)',
        backgroundSize: ['cover']
      }))
    })
    act(() => renderer!.root.findByType('Image').props.onLoad({ nativeEvent: { source: { width: 400, height: 200 } } }))
    act(() => renderer!.root.findAllByType('View')[1].props.onLayout(layoutEvent(layoutWidth, layoutHeight)))
    expect(renderer!.root.findByType('Image').props.style).toMatchObject({ width: 200, height: 100 })
    expect(renderer!.root.findByType('Image').props.style.opacity).toBeUndefined()
    act(() => renderer!.unmount())
  })

  test.each([
    ['auto auto', ['auto'], 400, 200, false, 400, 200],
    ['fixed width with auto height', [120, 'auto'], 400, 200, false, 120, 60],
    ['auto width with fixed height', ['auto', 60], 400, 200, false, 120, 60],
    ['cover', ['cover'], 100, 100, true, 200, 200]
  ])('resolves %s with stretch and explicit positioning', (_name, backgroundSize, sourceWidth, sourceHeight, needsLayout, width, height) => {
    let renderer: ReactTestRenderer
    act(() => {
      renderer = create(renderView({
        width: 200,
        height: 100,
        backgroundImage: 'url(https://example.com/a.png)',
        backgroundSize,
        backgroundPosition: ['right', 0, 'bottom', 0]
      }))
    })
    if (needsLayout) {
      act(() => renderer!.root.findAllByType('View')[1].props.onLayout(layoutEvent(200, 100)))
    }
    act(() => renderer!.root.findByType('Image').props.onLoad({ nativeEvent: { source: { width: sourceWidth, height: sourceHeight } } }))
    const image = renderer!.root.findByType('Image')
    expect(image.props.resizeMode).toBe('stretch')
    expect(image.props.style).toMatchObject({ width, height, right: 0, bottom: 0 })
    expect(image.props.style.opacity).toBeUndefined()
    act(() => renderer!.unmount())
  })

  test('caches stale dynamic source facts and reuses them when the source returns', () => {
    const callbacks: Array<(width: number, height: number) => void> = []
    mockGetSize.mockImplementation((_src, success) => callbacks.push(success))
    const viewStyle = (src: string) => ({
      width: 200,
      height: 100,
      backgroundImage: `url(${src})`,
      backgroundSize: ['auto']
    })
    let renderer: ReactTestRenderer
    act(() => {
      renderer = create(renderView(viewStyle('https://example.com/a.png')))
    })
    const oldOnLoad = renderer!.root.findByType('Image').props.onLoad

    act(() => renderer!.update(renderView(viewStyle('https://example.com/b.png'))))
    act(() => callbacks[1](120, 60))
    expect(renderer!.root.findByType('Image').props.style).toMatchObject({ width: 120, height: 60 })
    act(() => callbacks[0](80, 40))
    expect(renderer!.root.findByType('Image').props.style).toMatchObject({ width: 120, height: 60 })

    act(() => renderer!.root.findByType('Image').props.onLoad({ nativeEvent: { source: { width: 140, height: 70 } } }))
    expect(renderer!.root.findByType('Image').props.style).toMatchObject({ width: 120, height: 60 })
    act(() => oldOnLoad({ nativeEvent: { source: { width: 60, height: 30 } } }))
    const image = renderer!.root.findByType('Image')
    expect(image.props.source).toEqual({ uri: 'https://example.com/b.png' })
    expect(image.props.style).toMatchObject({ width: 120, height: 60 })

    act(() => renderer!.update(renderView(viewStyle('https://example.com/a.png'))))
    expect(renderer!.root.findByType('Image').props.style).toMatchObject({ width: 80, height: 40 })
    expect(mockGetSize).toHaveBeenCalledTimes(2)
    act(() => renderer!.unmount())
  })

  test('uses current need when an earlier background query returns', () => {
    const callbacks: Array<(width: number, height: number) => void> = []
    mockGetSize.mockImplementation((_src, success) => callbacks.push(success))
    let commits = 0
    const renderProfiledView = (backgroundSize: Array<string | number>) => React.createElement(
      React.Profiler,
      { id: 'view', onRender: () => { commits++ } },
      renderView({
        width: 200,
        height: 100,
        backgroundImage: 'url(https://example.com/a.png)',
        backgroundSize
      })
    )
    let renderer: ReactTestRenderer
    act(() => {
      renderer = create(renderProfiledView(['contain']))
    })
    act(() => renderer!.root.findAllByType('View')[1].props.onLayout(layoutEvent(200, 100)))
    act(() => renderer!.update(renderProfiledView([120, 60])))
    const commitsBeforeQuery = commits
    act(() => callbacks[0](400, 200))
    expect(commits).toBe(commitsBeforeQuery)

    act(() => renderer!.update(renderProfiledView(['contain'])))
    expect(renderer!.root.findByType('Image').props.style).toMatchObject({ width: 200, height: 100 })
    act(() => renderer!.unmount())
  })

  test('publishes an earlier background query result when current need becomes true again', () => {
    const callbacks: Array<(width: number, height: number) => void> = []
    mockGetSize.mockImplementation((_src, success) => callbacks.push(success))
    let commits = 0
    const renderProfiledView = (backgroundSize: Array<string | number>) => React.createElement(
      React.Profiler,
      { id: 'view', onRender: () => { commits++ } },
      renderView({
        width: 200,
        height: 100,
        backgroundImage: 'url(https://example.com/a.png)',
        backgroundSize
      })
    )
    let renderer: ReactTestRenderer
    act(() => {
      renderer = create(renderProfiledView(['auto']))
    })
    act(() => renderer!.update(renderProfiledView([120, 60])))
    act(() => renderer!.update(renderProfiledView(['auto'])))
    const commitsBeforeQuery = commits
    act(() => callbacks[0](400, 200))
    expect(commits).toBe(commitsBeforeQuery + 1)
    expect(renderer!.root.findByType('Image').props.style).toMatchObject({ width: 400, height: 200 })
    act(() => renderer!.unmount())
  })

  test.each([
    ['auto facts', ['auto'], { width: 400, height: 200 }],
    ['percentage layout', ['50%', '50%'], { width: '50%', height: '50%' }],
    ['cover facts', ['cover'], { width: 200, height: 100 }]
  ])('precollects passive background facts without concurrent commits for %s', (_name, nextSize, expectedStyle) => {
    let commits = 0
    const renderProfiledView = (backgroundSize: Array<string | number>) => React.createElement(
      React.Profiler,
      { id: 'view', onRender: () => { commits++ } },
      renderView({
        width: 200,
        height: 100,
        backgroundImage: 'url(https://example.com/a.png)',
        backgroundSize
      })
    )
    let renderer: ReactTestRenderer
    act(() => {
      renderer = create(renderProfiledView([120, 60]), concurrentOptions)
    })
    const commitsAfterMount = commits
    const background = renderer!.root.findAllByType('View')[1]
    const image = renderer!.root.findByType('Image')
    expect(image.props.style).toMatchObject({ width: 120, height: 60 })

    act(() => image.props.onLoad({ nativeEvent: { source: { width: 400, height: 200 } } }))
    act(() => background.props.onLayout(layoutEvent(200, 100)))
    expect(commits).toBe(commitsAfterMount)
    expect(renderer!.root.findByType('Image').props.style).toMatchObject({ width: 120, height: 60 })

    act(() => renderer!.update(renderProfiledView(nextSize)))
    expect(commits).toBe(commitsAfterMount + 1)
    const finalBackground = renderer!.root.findAllByType('View')[1]
    const finalImage = renderer!.root.findByType('Image')
    expect(finalBackground.props.style).toMatchObject({ position: 'absolute', overflow: 'hidden' })
    expect(finalImage.props.resizeMode).toBe('stretch')
    expect(finalImage.props.style).toMatchObject(expectedStyle)
    expect(finalImage.props.style.opacity).toBeUndefined()
    act(() => renderer!.unmount())
  })

  test('uses concurrent current need and keeps the first background size fact after committed transitions', () => {
    const callbacks: Array<(width: number, height: number) => void> = []
    mockGetSize.mockImplementation((_src, success) => callbacks.push(success))
    let commits = 0
    const renderProfiledView = (backgroundSize: Array<string | number>) => React.createElement(
      React.Profiler,
      { id: 'view', onRender: () => { commits++ } },
      renderView({
        width: 200,
        height: 100,
        backgroundImage: 'url(https://example.com/a.png)',
        backgroundSize
      })
    )
    let renderer: ReactTestRenderer
    act(() => {
      renderer = create(renderProfiledView(['cover']), concurrentOptions)
    })
    act(() => renderer!.root.findAllByType('View')[1].props.onLayout(layoutEvent(200, 100)))

    act(() => renderer!.update(renderProfiledView([120, 60])))
    const commitsBeforeInactiveQuery = commits
    act(() => callbacks[0](400, 200))
    expect(commits).toBe(commitsBeforeInactiveQuery)
    expect(renderer!.root.findByType('Image').props.style).toMatchObject({ width: 120, height: 60 })

    act(() => renderer!.update(renderProfiledView(['cover'])))
    expect(renderer!.root.findByType('Image').props.style).toMatchObject({ width: 200, height: 100 })
    const commitsBeforeActiveQuery = commits
    expect(commits).toBe(commitsBeforeActiveQuery)
    expect(renderer!.root.findByType('Image').props.style).toMatchObject({ width: 200, height: 100 })
    expect(mockGetSize).toHaveBeenCalledTimes(1)
    expect(renderer!.root.findAllByType('View')[1].props.style).toMatchObject({ position: 'absolute', overflow: 'hidden' })
    act(() => renderer!.unmount())
  })
})
