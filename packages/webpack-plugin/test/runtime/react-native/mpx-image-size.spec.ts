/// <reference types="jest" />

import React from 'react'
import { act, create, ReactTestRenderer } from 'react-test-renderer'
import { Image as RNImage } from 'react-native'
import MpxImage from '../../../lib/runtime/components/react/mpx-image'

const mockGetSize = RNImage.getSize as jest.Mock
const mockResolveAssetSource = RNImage.resolveAssetSource as jest.Mock

jest.mock('@d11/react-native-fast-image', () => {
  const React = jest.requireActual('react')
  return React.forwardRef((props: any, ref: any) => React.createElement('FastImage', Object.assign({ ref }, props)))
})

jest.mock('react-native-svg/css', () => {
  const React = jest.requireActual('react')
  return {
    SvgCssUri: (props: any) => React.createElement('SvgCssUri', props),
    LocalSvg: (props: any) => React.createElement('LocalSvg', props)
  }
})

jest.mock('react-native-gesture-handler', () => ({
  Gesture: { Tap: () => ({}), Pan: () => ({}), LongPress: () => ({}) }
}))

jest.mock('react-native-safe-area-context', () => ({
  initialWindowMetrics: { insets: { top: 0, right: 0, bottom: 0, left: 0 } }
}))

jest.mock('../../../lib/runtime/components/react/mpx-portal', () => ({
  __esModule: true,
  default: 'Portal'
}))

const layoutEvent = (width: number, height: number) => ({ nativeEvent: { layout: { width, height } } })
const renderImage = (props: Record<string, any>) => React.createElement(MpxImage, props)
type ConcurrentTestRendererOptions = NonNullable<Parameters<typeof create>[1]> & { unstable_isConcurrent: boolean }
const concurrentOptions: ConcurrentTestRendererOptions = {
  createNodeMock: () => null,
  unstable_isConcurrent: true
}
const concurrentActEnvironment = globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }
concurrentActEnvironment.IS_REACT_ACT_ENVIRONMENT = true

describe('MpxImage size resolution', () => {
  beforeEach(() => {
    mockGetSize.mockReset()
    mockResolveAssetSource.mockReset()
  })

  test.each(['scaleToFill', 'aspectFit', 'aspectFill'] as const)('renders %s directly without querying', (mode) => {
    let renderer: ReactTestRenderer
    act(() => {
      renderer = create(renderImage({ src: 'https://example.com/a.png', mode, 'enable-fast-image': false, style: { width: 200, height: 100 } }))
    })

    const image = renderer!.root.findByType('Image')
    expect(renderer!.toJSON()).toMatchObject({ type: 'Image' })
    expect(image.props.style).toMatchObject({ width: 200, height: 100 })
    expect(image.props.opacity).toBeUndefined()
    expect(image.props.onLoad).toEqual(expect.any(Function))
    expect(mockGetSize).not.toHaveBeenCalled()

    act(() => renderer!.unmount())
  })

  test('renders FastImage directly without an extra View', () => {
    let renderer: ReactTestRenderer
    act(() => {
      renderer = create(renderImage({ src: 'https://example.com/a.png', mode: 'aspectFit', style: { width: 200, height: 100 } }))
    })
    expect(renderer!.toJSON()).toMatchObject({ type: 'FastImage' })
    expect(renderer!.root.findByType('FastImage').props.style).toMatchObject({ width: 200, height: 100 })
    expect(mockGetSize).not.toHaveBeenCalled()
    act(() => renderer!.unmount())
  })

  test.each(['widthFix', 'heightFix', 'center'] as const)('keeps %s wrapped with a mounted pending bitmap', (mode) => {
    let renderer: ReactTestRenderer
    act(() => {
      renderer = create(renderImage({ src: 'https://example.com/a.png', mode, 'enable-fast-image': false, style: { width: 200, height: 100 } }))
    })
    expect(renderer!.toJSON()).toMatchObject({ type: 'View' })
    expect(renderer!.root.findByType('View').props.onLayout).toEqual(expect.any(Function))
    expect(renderer!.root.findByType('Image').props.style).toEqual({ width: 1, height: 1, opacity: 0 })
    act(() => renderer!.unmount())
  })

  test.each(['image size', 'layout'] as const)('publishes only after both facts are ready when %s arrives first', (firstFact) => {
    let commits = 0
    const renderProfiledImage = () => React.createElement(
      React.Profiler,
      { id: 'image', onRender: () => { commits++ } },
      renderImage({ src: 'https://example.com/a.png', mode: 'widthFix', 'enable-fast-image': false, style: { width: 200, height: 100 } })
    )
    let renderer: ReactTestRenderer
    act(() => {
      renderer = create(renderProfiledImage())
    })
    const commitsAfterMount = commits
    const commitImageSize = () => renderer!.root.findByType('Image').props.onLoad({ nativeEvent: { source: { width: 400, height: 200 } } })
    const commitLayout = () => renderer!.root.findByType('View').props.onLayout(layoutEvent(200, 100))

    act(firstFact === 'image size' ? commitImageSize : commitLayout)
    expect(commits).toBe(commitsAfterMount)
    act(firstFact === 'image size' ? commitLayout : commitImageSize)
    expect(commits).toBe(commitsAfterMount + 1)
    expect(renderer!.root.findByType('Image').props.style).toMatchObject({ width: '100%', height: '100%' })
    act(() => renderer!.unmount())
  })

  test.each([
    ['widthFix', { width: 200, height: 0 }, layoutEvent(200, 0), 'height', 100],
    ['heightFix', { width: 0, height: 100 }, layoutEvent(0, 100), 'width', 200]
  ])('accepts zero layout size in %s mode', (mode, style, event, sizeKey, expectedSize) => {
    let renderer: ReactTestRenderer
    act(() => {
      renderer = create(renderImage({ src: 'https://example.com/a.png', mode, 'enable-fast-image': false, style }))
    })
    act(() => renderer!.root.findByType('Image').props.onLoad({ nativeEvent: { source: { width: 400, height: 200 } } }))
    act(() => renderer!.root.findByType('View').props.onLayout(event))
    expect(renderer!.root.findByType('View').props.style[sizeKey]).toBe(expectedSize)
    expect(renderer!.root.findByType('Image').props.style.opacity).toBeUndefined()
    act(() => renderer!.unmount())
  })

  test('keeps the bitmap mounted while pending and consumes passive facts on mode change', () => {
    let renderer: ReactTestRenderer
    act(() => {
      renderer = create(renderImage({ src: 'https://example.com/a.png', mode: 'scaleToFill', 'enable-fast-image': false, style: { width: 200, height: 100 } }))
    })

    const directImage = renderer!.root.findByType('Image')
    act(() => directImage.props.onLoad({ nativeEvent: { source: { width: 400, height: 200 } } }))
    expect(mockGetSize).not.toHaveBeenCalled()

    act(() => {
      renderer!.update(renderImage({ src: 'https://example.com/a.png', mode: 'widthFix', 'enable-fast-image': false, style: { width: 200, height: 100 } }))
    })
    expect(renderer!.toJSON()).toMatchObject({ type: 'View' })
    expect(renderer!.root.findByType('Image').props.style).toEqual({ width: 1, height: 1, opacity: 0 })
    expect(mockGetSize).not.toHaveBeenCalled()

    act(() => renderer!.root.findByType('View').props.onLayout(layoutEvent(200, 100)))
    expect(renderer!.root.findByType('View').props.style.height).toBe(100)
    expect(renderer!.root.findByType('Image').props.style).toMatchObject({ width: '100%', height: '100%' })

    act(() => renderer!.unmount())
  })

  test('stores a pending query result without publishing when current need is false', () => {
    const callbacks: Array<(width: number, height: number) => void> = []
    mockGetSize.mockImplementation((_src, success) => callbacks.push(success))
    let commits = 0
    const renderProfiledImage = (mode: string) => React.createElement(
      React.Profiler,
      { id: 'image', onRender: () => { commits++ } },
      renderImage({ src: 'https://example.com/a.png', mode, 'enable-fast-image': false, style: { width: 200, height: 100 } })
    )
    let renderer: ReactTestRenderer
    act(() => {
      renderer = create(renderProfiledImage('widthFix'))
    })
    act(() => renderer!.update(renderProfiledImage('scaleToFill')))
    const commitsBeforeQuery = commits
    act(() => callbacks[0](400, 200))
    expect(commits).toBe(commitsBeforeQuery)

    act(() => renderer!.update(renderProfiledImage('widthFix')))
    act(() => renderer!.root.findByType('View').props.onLayout(layoutEvent(200, 100)))
    expect(renderer!.root.findByType('Image').props.style).toMatchObject({ width: '100%', height: '100%' })
    act(() => renderer!.unmount())
  })

  test('publishes an earlier query result when current need becomes true again', () => {
    const callbacks: Array<(width: number, height: number) => void> = []
    mockGetSize.mockImplementation((_src, success) => callbacks.push(success))
    let commits = 0
    const renderProfiledImage = (mode: string) => React.createElement(
      React.Profiler,
      { id: 'image', onRender: () => { commits++ } },
      renderImage({ src: 'https://example.com/a.png', mode, 'enable-fast-image': false, style: { width: 200, height: 100 } })
    )
    let renderer: ReactTestRenderer
    act(() => {
      renderer = create(renderProfiledImage('widthFix'))
    })
    act(() => renderer!.root.findByType('View').props.onLayout(layoutEvent(200, 100)))
    act(() => renderer!.update(renderProfiledImage('scaleToFill')))
    act(() => renderer!.update(renderProfiledImage('widthFix')))
    const commitsBeforeQuery = commits
    act(() => callbacks[0](400, 200))
    expect(commits).toBe(commitsBeforeQuery + 1)
    expect(renderer!.root.findByType('View').props.style.height).toBe(100)
    act(() => renderer!.unmount())
  })

  test.each([
    ['Image', false, { nativeEvent: { source: { width: 400, height: 200 } } }],
    ['FastImage', true, { nativeEvent: { width: 400, height: 200 } }]
  ])('reuses the first passive %s fact without querying', (imageType, enableFastImage, loadEvent) => {
    let commits = 0
    const renderProfiledImage = (mode: string) => React.createElement(
      React.Profiler,
      { id: 'image', onRender: () => { commits++ } },
      renderImage({ src: 'https://example.com/a.png', mode, 'enable-fast-image': enableFastImage, style: { width: 200, height: 100 } })
    )
    let renderer: ReactTestRenderer
    act(() => {
      renderer = create(renderProfiledImage('aspectFit'), concurrentOptions)
    })
    const commitsAfterMount = commits
    const directImage = renderer!.root.findByType(imageType)
    expect(renderer!.toJSON()).toMatchObject({ type: imageType })
    expect(directImage.props.style).toMatchObject({ width: 200, height: 100 })

    act(() => directImage.props.onLoad(loadEvent))
    expect(commits).toBe(commitsAfterMount)
    expect(renderer!.root.findByType(imageType).props.style.opacity).toBeUndefined()

    act(() => renderer!.update(renderProfiledImage('widthFix')))
    expect(commits).toBe(commitsAfterMount + 1)
    expect(renderer!.toJSON()).toMatchObject({ type: 'View' })
    expect(renderer!.root.findByType(imageType).props.style).toEqual({ width: 1, height: 1, opacity: 0 })
    act(() => renderer!.root.findByType('View').props.onLayout(layoutEvent(200, 100)))
    expect(renderer!.root.findByType('View').props.style.height).toBe(100)
    expect(renderer!.root.findByType(imageType).props.style).toMatchObject({ width: '100%', height: '100%' })
    expect(mockGetSize).not.toHaveBeenCalled()

    act(() => renderer!.update(renderProfiledImage('aspectFit')))
    expect(renderer!.toJSON()).toMatchObject({ type: imageType })
    expect(renderer!.root.findByType(imageType).props.style).toMatchObject({ width: 200, height: 100 })

    act(() => renderer!.update(renderProfiledImage('widthFix')))
    expect(renderer!.root.findByType('View').props.style.height).toBe(100)
    expect(renderer!.root.findByType(imageType).props.style.opacity).toBeUndefined()
    expect(mockGetSize).not.toHaveBeenCalled()
    act(() => renderer!.unmount())
  })

  test('caches stale dynamic source facts and reuses them when the source returns', () => {
    const callbacks: Array<(width: number, height: number) => void> = []
    mockGetSize.mockImplementation((_src, success) => callbacks.push(success))
    const imageProps = (src: string) => ({ src, mode: 'widthFix', 'enable-fast-image': false, style: { width: 200, height: 100 } })
    let renderer: ReactTestRenderer
    act(() => {
      renderer = create(renderImage(imageProps('https://example.com/a.png')))
    })
    act(() => renderer!.root.findByType('View').props.onLayout(layoutEvent(200, 100)))
    const oldOnLoad = renderer!.root.findByType('Image').props.onLoad

    act(() => renderer!.update(renderImage(imageProps('https://example.com/b.png'))))
    expect(renderer!.root.findByType('Image').props.style).toEqual({ width: 1, height: 1, opacity: 0 })
    act(() => callbacks[1](100, 100))
    expect(renderer!.root.findByType('View').props.style.height).toBe(200)
    act(() => callbacks[0](400, 200))
    expect(renderer!.root.findByType('View').props.style.height).toBe(200)

    act(() => renderer!.root.findByType('Image').props.onLoad({ nativeEvent: { source: { width: 300, height: 300 } } }))
    expect(renderer!.root.findByType('View').props.style.height).toBe(200)
    act(() => oldOnLoad({ nativeEvent: { source: { width: 400, height: 100 } } }))
    expect(renderer!.root.findByType('View').props.style.height).toBe(200)
    expect(renderer!.root.findByType('Image').props.source).toEqual({ uri: 'https://example.com/b.png' })

    act(() => renderer!.update(renderImage(imageProps('https://example.com/a.png'))))
    expect(renderer!.root.findByType('View').props.style.height).toBe(100)
    expect(renderer!.root.findByType('Image').props.style.opacity).toBeUndefined()
    expect(mockGetSize).toHaveBeenCalledTimes(2)
    act(() => renderer!.unmount())
  })

  test('keeps resolved local dimensions and ignores later onLoad facts', () => {
    const asset = 1
    mockResolveAssetSource.mockReturnValue({ uri: 'asset.png', width: 100, height: 50 })
    let renderer: ReactTestRenderer
    act(() => {
      renderer = create(renderImage({ src: asset, mode: 'widthFix', 'enable-fast-image': false, style: { width: 200, height: 100 } }))
    })
    act(() => renderer!.root.findByType('View').props.onLayout(layoutEvent(200, 100)))
    expect(renderer!.root.findByType('View').props.style.height).toBe(100)
    expect(renderer!.root.findByType('Image').props.style).toMatchObject({ width: '100%', height: '100%' })
    expect(mockGetSize).not.toHaveBeenCalled()

    act(() => renderer!.root.findByType('Image').props.onLoad({ nativeEvent: { source: { width: 120, height: 80 } } }))
    expect(renderer!.root.findByType('View').props.style.height).toBe(100)

    act(() => {
      renderer!.update(renderImage({ src: asset, mode: 'widthFix', 'enable-fast-image': false, style: { width: 200, height: 100 } }))
    })
    expect(renderer!.root.findByType('View').props.style.height).toBe(100)

    act(() => renderer!.unmount())
  })

  test('normalizes load detail and uses resolved local SVG dimensions when available', () => {
    const bindload = jest.fn()
    let renderer: ReactTestRenderer
    act(() => {
      renderer = create(renderImage({ src: 'https://example.com/a.png', mode: 'aspectFit', bindload, 'enable-fast-image': false, style: { width: 200, height: 100 } }))
    })
    act(() => renderer!.root.findByType('Image').props.onLoad({ nativeEvent: { source: { width: 100, height: 50 } } }))
    expect(bindload.mock.calls[0][0].detail).toEqual({ width: 100, height: 50 })

    act(() => {
      renderer!.update(renderImage({ src: 'https://example.com/a.png', mode: 'widthFix', bindload, style: { width: 200, height: 100 } }))
    })
    act(() => renderer!.root.findByType('FastImage').props.onLoad({ nativeEvent: { width: 120, height: 80 } }))
    expect(bindload.mock.calls[1][0].detail).toEqual({ width: 120, height: 80 })

    act(() => {
      renderer!.update(renderImage({ src: 'https://example.com/a.svg?x=1', mode: 'aspectFit', bindload, style: { width: 200, height: 100 } }))
    })
    const remoteSvg = renderer!.root.findByType('SvgCssUri')
    expect(remoteSvg.props.style).not.toHaveProperty('width')
    expect(remoteSvg.props.style).not.toHaveProperty('height')
    act(() => renderer!.root.findByType('View').props.onLayout(layoutEvent(200, 100)))
    act(() => remoteSvg.props.onLayout(layoutEvent(120, 80)))
    expect(bindload.mock.calls[2][0].detail).toEqual({ width: 120, height: 80 })

    act(() => renderer!.unmount())

    bindload.mockClear()
    mockResolveAssetSource.mockReturnValue({ uri: 'asset.svg', width: 100, height: 50 })
    act(() => {
      renderer = create(renderImage({ src: 2, mode: 'aspectFit', bindload, style: { width: 200, height: 100 } }))
    })
    const localSvg = renderer!.root.findByType('LocalSvg')
    expect(localSvg.props.style).not.toHaveProperty('width')
    expect(localSvg.props.style).not.toHaveProperty('height')
    expect(localSvg.props.style.opacity).toBe(0)
    act(() => renderer!.root.findByType('View').props.onLayout(layoutEvent(200, 100)))
    expect(renderer!.root.findByType('LocalSvg').props.style.opacity).toBeUndefined()
    expect(renderer!.root.findByType('LocalSvg').props.style.transform).toEqual([
      { translateY: 0 },
      { translateX: 0 },
      { scale: 2 }
    ])
    act(() => localSvg.props.onLayout(layoutEvent(90, 60)))
    expect(bindload.mock.calls[0][0].detail).toEqual({ width: 90, height: 60 })
    expect(renderer!.root.findByType('LocalSvg').props.style.opacity).toBeUndefined()

    act(() => renderer!.unmount())
  })
})
