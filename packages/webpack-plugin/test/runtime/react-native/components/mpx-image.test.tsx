import React from 'react'
import { act, fireEvent, render, screen } from '@testing-library/react-native'
import { Image as RNImage } from 'react-native'
import MpxImage from '../../../../lib/runtime/components/react/mpx-image'
import { flushImageSize } from './helpers'

const mockPortal = jest.fn()

jest.mock('../../../../lib/runtime/components/react/mpx-portal', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const mockReact = require('react')
  return ({ children }: { children: any }) => {
    mockPortal(children)
    return mockReact.createElement(mockReact.Fragment, null, children)
  }
})

jest.mock('react-native-svg/css', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const mockReact = require('react')
  const SvgCssUri = (props: any) => mockReact.createElement('SvgCssUri', props)
  const LocalSvg = (props: any) => mockReact.createElement('LocalSvg', props)
  return {
    SvgCssUri,
    LocalSvg
  }
})

describe('MpxImage', () => {
  beforeEach(() => {
    mockPortal.mockClear()
  })

  it('handles load, error and layout modes', async () => {
    const bindload = jest.fn()
    const binderror = jest.fn()

    const { rerender } = render(
      <MpxImage
        testID="plain-image"
        src="https://example.com/a.png"
        mode="aspectFit"
        enable-fast-image={false}
        bindload={bindload}
        binderror={binderror}
      />
    )

    const image = screen.getByTestId('plain-image')
    fireEvent(image, 'load', {
      persist: jest.fn(),
      nativeEvent: {
        source: { width: 64, height: 32 }
      }
    })
    expect(bindload).toHaveBeenCalledWith(expect.objectContaining({
      type: 'load',
      detail: { width: 64, height: 32 }
    }))

    fireEvent(image, 'error', {
      nativeEvent: {
        error: 'load failed'
      }
    })
    expect(binderror).toHaveBeenCalledWith(expect.objectContaining({
      type: 'error',
      detail: { errMsg: 'load failed' }
    }))

    rerender(
      <MpxImage
        testID="layout-image"
        src="https://example.com/b.png"
        mode="widthFix"
        style={{ width: 200, position: 'fixed' }}
        enable-fast-image={false}
        bindload={bindload}
      />
    )

    const layoutImage = screen.getByTestId('layout-image')
    fireEvent(layoutImage, 'layout', {
      nativeEvent: {
        layout: { width: 200, height: 100 }
      }
    })
    await flushImageSize()
    expect(screen.getByTestId('layout-image').props.style.height).toBe(200)
    fireEvent(screen.getByTestId('layout-image'), 'layout', {
      nativeEvent: {
        layout: { width: 200, height: 200 }
      }
    })
    expect(screen.getByTestId('layout-image').props.style.height).toBe(200)
    fireEvent(screen.getByTestId('layout-image'), 'layout', {
      nativeEvent: {
        layout: { width: 250, height: 100 }
      }
    })
    expect(screen.getByTestId('layout-image').props.style.height).toBe(250)
    expect(layoutImage.props.style).toEqual(expect.objectContaining({
      width: 200,
      overflow: 'hidden'
    }))
    expect(mockPortal).toHaveBeenCalled()
  })

  it('handles svg image sources and errors', () => {
    const bindload = jest.fn()
    const binderror = jest.fn()
    const { UNSAFE_getByType, rerender } = render(
      <MpxImage
        testID="svg-image"
        src="https://example.com/a.svg"
        mode="aspectFill"
        bindload={bindload}
        binderror={binderror}
      />
    )

    const svg = UNSAFE_getByType('SvgCssUri' as any)
    act(() => {
      fireEvent(svg, 'layout', {
        nativeEvent: {
          layout: { width: 80, height: 40 }
        }
      })
    })
    expect(bindload).toHaveBeenCalledWith(expect.objectContaining({
      type: 'load',
      detail: { width: 80, height: 40 }
    }))

    fireEvent(svg, 'error', new Error('bad svg'))
    expect(binderror).toHaveBeenCalledWith(expect.objectContaining({
      type: 'error',
      detail: { errMsg: 'bad svg' }
    }))

    rerender(
      <MpxImage
        testID="local-svg-image"
        src={{ uri: 'local.svg', width: 40, height: 20 } as any}
        is-svg={true}
        mode="widthFix"
        bindload={bindload}
      />
    )
    const localSvg = UNSAFE_getByType('LocalSvg' as any)
    act(() => {
      fireEvent(localSvg, 'layout', {
        nativeEvent: {
          layout: { width: 40, height: 20 }
        }
      })
    })
    expect(bindload).toHaveBeenCalledWith(expect.objectContaining({
      detail: { width: 40, height: 20 }
    }))
  })

  it.each([
    ['top', [{ translateX: 60 }]],
    ['bottom', [{ translateY: 60 }, { translateX: 60 }]],
    ['center', [{ translateY: 30 }, { translateX: 60 }]],
    ['left', [{ translateY: 30 }]],
    ['right', [{ translateY: 30 }, { translateX: 120 }]],
    ['top left', undefined],
    ['top right', [{ translateX: 120 }]],
    ['bottom left', [{ translateY: 60 }]],
    ['bottom right', [{ translateY: 60 }, { translateX: 120 }]]
  ])('renders layout mode %s', async (mode, transform) => {
    const { UNSAFE_getByType } = render(
      <MpxImage
        testID={`mode-image-${mode}`}
        src={{ uri: `${mode}.png`, width: 120, height: 60 } as any}
        mode={mode as any}
        style={{ width: 240, height: 120 }}
        enable-fast-image={false}
      />
    )
    await flushImageSize()

    const image = UNSAFE_getByType(RNImage)
    expect(screen.getByTestId(`mode-image-${mode}`)).toBeTruthy()
    expect(image.props.resizeMode).toBe('stretch')
    expect(image.props.style).toEqual(expect.objectContaining({
      width: 120,
      height: 60
    }))
    if (transform) {
      expect(image.props.style.transform).toEqual(transform)
    } else {
      expect(image.props.style.transform).toBeUndefined()
    }
  })

  it('calculates heightFix layout from image ratio', async () => {
    const { UNSAFE_getByType } = render(
      <MpxImage
        testID="mode-image-heightFix"
        src={{ uri: 'heightFix.png', width: 120, height: 60 } as any}
        mode="heightFix"
        style={{ height: 120 }}
        enable-fast-image={false}
      />
    )
    await flushImageSize()

    const image = UNSAFE_getByType(RNImage)
    expect(screen.getByTestId('mode-image-heightFix').props.style).toEqual(expect.objectContaining({
      width: 240,
      height: 120
    }))
    expect(image.props.resizeMode).toBe('stretch')
    expect(image.props.style).toEqual(expect.objectContaining({
      width: '100%',
      height: '100%'
    }))
  })

  it('falls back to default widthFix height when image size cannot be resolved', async () => {
    render(
      <MpxImage
        testID="failed-size-image"
        src="fail://image.png"
        mode="widthFix"
        style={{ width: 200 }}
        enable-fast-image={false}
      />
    )
    await flushImageSize()

    const image = screen.getByTestId('failed-size-image')
    expect(image.props.style).toEqual(expect.objectContaining({
      width: 200,
      height: 240,
      overflow: 'hidden'
    }))
  })

  it('handles default source load and unresolved asset metadata', async () => {
    const bindload = jest.fn()
    render(
      <MpxImage
        testID="default-source-image"
        bindload={bindload}
        enable-fast-image={false}
      />
    )

    fireEvent(screen.getByTestId('default-source-image'), 'load', {
      persist: jest.fn(),
      nativeEvent: {}
    })
    await flushImageSize()
    expect(bindload).toHaveBeenCalledWith(expect.objectContaining({
      detail: { width: 100, height: 100 }
    }))

    ;(RNImage.resolveAssetSource as jest.Mock)
      .mockReturnValueOnce(undefined)
      .mockReturnValueOnce({ uri: 'asset-no-size.png' })
      .mockReturnValueOnce({ uri: 'asset-no-size.png' })

    const { UNSAFE_getAllByType } = render(
      <>
        <MpxImage
          testID="unresolved-asset-image"
          src={{ uri: 'missing-meta.png' } as any}
          enable-fast-image={false}
        />
        <MpxImage
          testID="asset-no-size-image"
          src={{ uri: 'asset-no-size.png' } as any}
          mode="heightFix"
          style={{ height: 120 }}
          enable-fast-image={false}
        />
      </>
    )
    await flushImageSize()
    expect(UNSAFE_getAllByType(RNImage)).toHaveLength(2)
    expect(screen.getByTestId('asset-no-size-image').props.style).toEqual(expect.objectContaining({
      width: 320,
      height: 120
    }))
  })

  it('handles svg fit, zero-size layout and unknown modes', () => {
    const { UNSAFE_getAllByType } = render(
      <>
        <MpxImage
          testID="svg-fit-image"
          src="https://example.com/fit.svg"
          mode="aspectFit"
          style={{ width: 100, height: 80 }}
        />
        <MpxImage
          testID="svg-zero-width-image"
          src="https://example.com/zero-width.svg"
          mode="heightFix"
          style={{ height: 80 }}
        />
        <MpxImage
          testID="svg-unknown-mode-image"
          src="https://example.com/unknown.svg"
          mode={'unknown' as any}
          style={{ width: 100, height: 80 }}
        />
      </>
    )

    const svgs = UNSAFE_getAllByType('SvgCssUri' as any)
    fireEvent(svgs[0], 'layout', {
      nativeEvent: {
        layout: { width: 50, height: 25 }
      }
    })
    fireEvent(svgs[1], 'layout', {
      nativeEvent: {
        layout: { width: 0, height: 25 }
      }
    })
    fireEvent(svgs[2], 'layout', {
      nativeEvent: {
        layout: { width: 50, height: 25 }
      }
    })
    const updatedSvgs = UNSAFE_getAllByType('SvgCssUri' as any)
    expect(updatedSvgs[0].props.style.transform).toEqual([
      { translateY: 15 },
      { translateX: 0 },
      { scale: 2 }
    ])
    expect(updatedSvgs[1].props.style.transform).toBeUndefined()
    expect(updatedSvgs[2].props.style.transform).toBeUndefined()
  })
})
