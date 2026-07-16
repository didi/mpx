import React, { useRef } from 'react'
import { act, render } from '@testing-library/react-native'
import { Image, Text, View } from 'react-native'
import {
  debounce,
  flatGesture,
  getCurrentPage,
  getDefaultAllowFontScaling,
  getRestProps,
  isBoxSizingAffectingStyle,
  isStringChildren,
  isText,
  omit,
  parseUrl,
  parseValues,
  pickStyle,
  renderImage,
  resolveTextFontSizePercentStyle,
  resolveTextLineHeightPercentStyle,
  setStyle,
  splitProps,
  splitStyle,
  transformBoxSizing,
  transformShorthand,
  traverseStyle,
  useDebounceCallback,
  useHover,
  useLayout,
  usePrevious,
  useRunOnJSCallback,
  useStableCallback,
  useTextPassThrough,
  useTransformStyle,
  useUpdateEffect,
  wrapChildren
} from '../../../lib/runtime/components/react/utils'
import { RouteContext, ScrollViewContext, TextPassThroughContext, VarContext } from '../../../lib/runtime/components/react/context'

describe('react runtime utils', () => {
  beforeEach(() => {
    global.__mpx = global.__mpx || { config: { rnConfig: {} } }
    global.__mpx.config = global.__mpx.config || { rnConfig: {} }
    global.__mpx.config.rnConfig = global.__mpx.config.rnConfig || {}
    global.__mpx.config.rnConfig.allowFontScaling = true
  })

  afterEach(() => {
    jest.useRealTimers()
    jest.restoreAllMocks()
  })

  it('handles object, url, text and prop helpers', () => {
    const CustomText = () => null
    Object.assign(CustomText, { isCustomText: true })

    expect(omit({ a: 1, b: 2, c: 3 }, ['b'])).toEqual({ a: 1, c: 3 })
    expect(parseUrl('url("https://example.com/a.png")')).toBe('https://example.com/a.png')
    expect(parseUrl('none')).toBeUndefined()
    expect(getRestProps({ role: 'button' }, { id: 'root', role: 'link' }, ['role'])).toEqual({
      role: 'button',
      id: 'root'
    })
    expect(getDefaultAllowFontScaling()).toBe(true)
    expect(isText(<Text>native</Text>)).toBe(true)
    expect(isText(<CustomText />)).toBe(true)
    expect(isText(<View />)).toBe(false)
    expect(isStringChildren(['a', 'b'])).toBe(true)
    expect(isStringChildren(['a', <Text key="b">b</Text>])).toBe(false)
    expect(parseValues('rgb(1, 2, 3) 10px calc(100% - 1px)')).toEqual([
      'rgb(1, 2, 3)',
      '10px',
      'calc(100% - 1px)'
    ])
  })

  it('handles helper defaults and empty inputs', () => {
    const previousMpx = global.__mpx
    const previousGetCurrentPages = global.getCurrentPages
    const setter = jest.fn()
    const presetBoxStyle = { boxSizing: 'border-box' }

    global.__mpx = undefined as any
    global.getCurrentPages = undefined as any
    transformBoxSizing(presetBoxStyle)
    setStyle({ nested: null }, ['nested', 'value'], setter)

    expect(parseUrl()).toBeUndefined()
    expect(getDefaultAllowFontScaling()).toBe(false)
    expect(isText(null)).toBe(false)
    expect(isStringChildren('text')).toBe(true)
    expect(isStringChildren(<Text>text</Text>)).toBe(false)
    expect(splitStyle({ width: 10, height: 20 })).toEqual({
      innerStyle: { width: 10, height: 20 }
    })
    expect(splitProps({ numberOfLines: 1, id: 'text' })).toEqual({
      textProps: { numberOfLines: 1 },
      innerProps: { id: 'text' }
    })
    expect(splitProps({ id: 'text', numberOfLines: 1 })).toEqual({
      textProps: { numberOfLines: 1 },
      innerProps: { id: 'text' }
    })
    expect(pickStyle({ width: 10 }, ['width', 'height'])).toEqual({ width: 10 })
    expect(presetBoxStyle.boxSizing).toBe('border-box')
    expect(setter).not.toHaveBeenCalled()
    expect(flatGesture()).toEqual([])
    expect(flatGesture([{ current: false }])).toEqual([])
    expect(getCurrentPage(1)).toBeUndefined()

    global.__mpx = previousMpx
    global.getCurrentPages = previousGetCurrentPages
  })

  it('expands one, two and four-value shorthand styles', () => {
    const style = {
      margin: '1px 2px 3px 4px',
      padding: '5px 6px',
      borderRadius: '7px',
      gap: '8px',
      border: 'invalid-token',
      textDecoration: 'underline'
    }
    const warn = jest.spyOn(console, 'warn').mockImplementation(jest.fn())

    transformShorthand(style, Object.keys(style), {})

    expect(style).toEqual(expect.objectContaining({
      marginTop: 1,
      marginRight: 2,
      marginBottom: 3,
      marginLeft: 4,
      paddingTop: 5,
      paddingRight: 6,
      paddingBottom: 5,
      paddingLeft: 6,
      borderRadius: '7px',
      rowGap: 8,
      columnGap: 8,
      borderWidth: 3,
      borderStyle: 'none',
      textDecorationLine: 'underline'
    }))
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('invalid-token'))
  })

  it('resolves nested variable fallbacks and background branches', () => {
    let result: ReturnType<typeof useTransformStyle> | undefined
    const warn = jest.spyOn(console, 'warn').mockImplementation(jest.fn())
    const Probe = () => {
      result = useTransformStyle({
        '--local': 'var(--theme)',
        '--un-tone': 'green',
        color: 'var(--missing, var(--local))',
        backgroundColor: 'var(--un-tone)',
        borderRadius: '50%',
        width: 'calc(25% + 10px)',
        transform: [{ translateX: 'calc(50%)' }],
        boxShadow: '',
        fontFamily: 42,
        backgroundPosition: 'center top',
        background: 'linear-gradient(red,blue) red invalid-token center/cover'
      }, {
        enableVar: true,
        transformRadiusPercent: true,
        parentWidth: 200,
        defaultStyle: {
          color: 'black',
          paddingTop: 1
        }
      })
      return <View testID="variable-style-probe" style={result.normalStyle} />
    }

    render(
      <VarContext.Provider value={{ '--theme': 'purple' }}>
        <Probe />
      </VarContext.Provider>
    )

    expect(result?.hasVarDec).toBe(true)
    expect(result?.hasSelfPercent).toBe(true)
    expect(result?.normalStyle).toEqual(expect.objectContaining({
      color: 'purple',
      backgroundColor: 'red',
      borderRadius: 0,
      width: 60,
      paddingTop: 1,
      boxSizing: 'content-box',
      backgroundImage: 'linear-gradient(red,blue)',
      backgroundPosition: ['50%'],
      backgroundSize: ['cover'],
      transform: [{ translateX: 0 }]
    }))
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('invalid-token'))
  })

  it('handles font and flex shorthand boundary forms', () => {
    const results: Array<ReturnType<typeof useTransformStyle>> = []
    const error = jest.spyOn(console, 'error').mockImplementation(jest.fn())
    const Probe = () => {
      results.push(
        useTransformStyle({ font: 16 as any }, {}),
        useTransformStyle({ font: 'bold' }, {}),
        useTransformStyle({ font: '16px' }, {}),
        useTransformStyle({ font: 'normal 16px / 20px Arial' }, {}),
        useTransformStyle({ font: '16px/bad Arial' }, {}),
        useTransformStyle({ font: '16px/ 20px Arial' }, {}),
        useTransformStyle({ font: '16px /20px Arial' }, {}),
        useTransformStyle({ flex: 'none' }, {}),
        useTransformStyle({ flex: 'initial' }, {}),
        useTransformStyle({ flex: 'auto' }, {}),
        useTransformStyle({ flex: '2 auto' }, {}),
        useTransformStyle({ flex: '2' }, {})
      )
      return null
    }

    render(<Probe />)

    expect(results[0].normalStyle.font).toBe(16)
    expect(results[1].normalStyle.font).toBeUndefined()
    expect(results[2].normalStyle.font).toBeUndefined()
    expect(results[3].normalStyle).toEqual(expect.objectContaining({
      fontSize: 16,
      lineHeight: 20,
      fontFamily: 'Arial'
    }))
    expect(results[4].normalStyle.lineHeight).toBe('bad')
    expect(results[5].normalStyle.lineHeight).toBe(20)
    expect(results[6].normalStyle.lineHeight).toBe(20)
    expect(results[7].normalStyle).toEqual(expect.objectContaining({ flexGrow: 0, flexShrink: 0 }))
    expect(results[8].normalStyle).toEqual(expect.objectContaining({ flexGrow: 0, flexShrink: 1 }))
    expect(results[9].normalStyle).toEqual(expect.objectContaining({ flexGrow: 1, flexShrink: 1 }))
    expect(results[10].normalStyle).toEqual(expect.objectContaining({ flexGrow: 2, flexShrink: 1 }))
    expect(results[11].normalStyle).toEqual(expect.objectContaining({ flexGrow: 2, flexShrink: 1, flexBasis: 0 }))
    expect(error).toHaveBeenCalledWith(expect.stringContaining('missing required <font-size>'))
    expect(error).toHaveBeenCalledWith(expect.stringContaining('missing required <font-family>'))
  })

  it('splits and picks style and prop buckets without losing leading fields', () => {
    const visited: string[] = []
    const style = {
      width: 100,
      color: 'red',
      backgroundImage: 'url(a.png)',
      height: 50
    }

    expect(splitStyle(style, (key) => visited.push(key))).toEqual({
      textStyle: { color: 'red' },
      backgroundStyle: { backgroundImage: 'url(a.png)' },
      innerStyle: { height: 50, width: 100 }
    })
    expect(visited).toEqual(['width', 'color', 'backgroundImage', 'height'])
    expect(splitProps({ id: 'root', numberOfLines: 2, title: 'hello' })).toEqual({
      textProps: { numberOfLines: 2 },
      innerProps: { title: 'hello', id: 'root' }
    })
    expect(pickStyle(style, ['width', 'height'], (key, value) => key === 'height' ? value as number / 2 : value)).toEqual({
      width: 100,
      height: 25
    })
    expect(isBoxSizingAffectingStyle('paddingTop')).toBe(true)

    const boxStyle: Record<string, any> = {}
    transformBoxSizing(boxStyle)
    expect(boxStyle.boxSizing).toBe('content-box')
  })

  it('expands runtime shorthand styles with defaults and percent resolution', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(jest.fn())
    const style = {
      margin: '1px 2px 3px',
      gap: '10% 25%',
      border: 'solid rebeccapurple',
      textShadow: '1px black',
      textDecoration: 'underline line-through dotted red',
      flexFlow: 'row wrap',
      outline: 2
    }

    transformShorthand(style, Object.keys(style), {
      parentWidth: 400,
      parentHeight: 200
    })

    expect(style).toEqual(expect.objectContaining({
      marginTop: 1,
      marginRight: 2,
      marginBottom: 3,
      marginLeft: 2,
      rowGap: 20,
      columnGap: 100,
      borderWidth: 3,
      borderStyle: 'solid',
      borderColor: 'rebeccapurple',
      textShadowOffset: { width: 1, height: 0 },
      textShadowColor: 'black',
      textDecorationLine: 'underline line-through',
      textDecorationStyle: 'dotted',
      textDecorationColor: 'red',
      flexDirection: 'row',
      flexWrap: 'wrap',
      outlineWidth: 2,
      outlineStyle: 'none'
    }))
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('missing offset-y'))
  })

  it('traverses and updates nested styles by key path', () => {
    const style = {
      transform: [
        { translateX: '10px' },
        { scale: 2 }
      ],
      shadow: {
        color: 'red'
      }
    }
    const visits: string[] = []

    traverseStyle(style, ({ keyPath }) => visits.push(keyPath.join('.')))
    setStyle(style, ['transform', '0', 'translateX'], ({ target, key }) => {
      target[key] = 20
    })

    expect(visits).toEqual([
      'transform',
      'transform.0',
      'transform.0.translateX',
      'transform.1',
      'transform.1.scale',
      'shadow',
      'shadow.color'
    ])
    expect(style.transform[0].translateX).toBe(20)
  })

  it('transforms CSS-like runtime styles through the hook pipeline', () => {
    let result: ReturnType<typeof useTransformStyle> | undefined
    const style = {
      color: 'var(--brand)',
      width: 'calc(50% + var(--space))',
      paddingTop: 'env(safe-area-inset-top, 8px)',
      padding: 4,
      border: 'none',
      font: 'italic small-caps 700 16px/1.5 "Ping Fang", sans-serif',
      fontFamily: '"Override", fallback',
      fontWeight: 500,
      transformOrigin: 10,
      transform: 'rotate(45deg) translate(10px, 20px) scale(2) matrix(1, 0, 0, 1, 5, 6) rotate3d(0, 1, 0, 30deg)',
      boxShadow: '1rpx 2px black',
      background: 'none',
      position: 'fixed'
    }

    const Probe = () => {
      result = useTransformStyle(style, {
        enableVar: true,
        parentWidth: 200,
        parentHeight: 100,
        defaultStyle: {
          minWidth: 1,
          paddingLeft: 9
        }
      })
      return <View testID="style-probe" style={result.normalStyle} />
    }

    render(
      <RouteContext.Provider value={{ pageId: 1, navigation: { insets: { top: 44 } } }}>
        <VarContext.Provider value={{ '--brand': 'red', '--space': '12px' }}>
          <Probe />
        </VarContext.Provider>
      </RouteContext.Provider>
    )

    expect(result?.hasVarDec).toBe(false)
    expect(result?.hasPositionFixed).toBe(true)
    expect(result?.normalStyle).toEqual(expect.objectContaining({
      color: 'red',
      width: 112,
      paddingTop: 44,
      padding: 4,
      paddingLeft: 9,
      borderWidth: 0,
      fontStyle: 'italic',
      fontVariant: 'small-caps',
      fontWeight: '500',
      fontSize: 16,
      lineHeight: '150%',
      fontFamily: 'Override',
      transformOrigin: '10',
      boxShadow: '0.5px 2px black',
      backgroundImage: 'none',
      backgroundColor: 'transparent',
      position: 'absolute',
      minWidth: 1,
      boxSizing: 'content-box'
    }))
    expect(result?.normalStyle.transform).toEqual([
      { rotateZ: '45deg' },
      { translateX: 10 },
      { translateY: 20 },
      { scaleX: 2 },
      { scaleY: 2 },
      { matrix: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 5, 6, 0, 1] },
      { rotateY: '30deg' }
    ])
  })

  it('keeps supported transform pieces while dropping unsupported ones', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(jest.fn())
    let result: ReturnType<typeof useTransformStyle> | undefined
    const style = {
      transform: 'bad rotateX(10deg) matrix(1,2,3) matrix3d(1,0,0,0,0,1,0,0,0,0,1,0,4,5,6,1) matrix3d(1,2) translate3d(1px,2px,3px) scale3d(2,3,4) rotate3d(1,0) rotate3d(1,0,0,20deg) rotate3d(0,0,1,40deg) rotate3d(1,1,0,50deg) translateZ(1px) skew(10deg,20deg) perspective(100px) unknown(1)'
    }

    const Probe = () => {
      result = useTransformStyle(style, {})
      return <View testID="transform-branch-probe" style={result.normalStyle} />
    }

    render(<Probe />)

    expect(result?.normalStyle.transform).toEqual(expect.arrayContaining([
      { rotateX: '10deg' },
      { matrix: [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 4, 5, 6, 1] },
      { translateX: 1 },
      { translateY: 2 },
      { scaleX: 2 },
      { scaleY: 3 },
      { rotateX: '20deg' },
      { rotateZ: '40deg' },
      { skewX: '10deg' },
      { skewY: '20deg' },
      { perspective: 100 }
    ]))
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('not a valid fn(value) form'))
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('matrix only supports 6 values'))
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('matrix only supports 16 values'))
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('translateZ'))
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('rotate3d only supports 4 values'))
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('rotate3d'))
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('unknown'))
  })

  it('normalizes font, flex and background runtime shorthand styles', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(jest.fn())
    let result: ReturnType<typeof useTransformStyle> | undefined
    const style = {
      font: 'condensed italic 50% / 120% Arial, sans-serif',
      flex: '2 3 10px',
      background: 'url(bg.png) no-repeat top left / 10px 20px',
      backgroundPosition: 'bottom 5px',
      backgroundSize: 'cover auto',
      outline: 'none',
      textDecoration: 'none'
    }

    const Probe = () => {
      result = useTransformStyle(style, {})
      return <View testID="shorthand-probe" style={result.normalStyle} />
    }

    render(<Probe />)

    expect(result?.normalStyle).toEqual(expect.objectContaining({
      fontStyle: 'italic',
      fontSize: '50%',
      lineHeight: '120%',
      fontFamily: 'Arial',
      flexGrow: 2,
      flexShrink: 3,
      flexBasis: 10,
      backgroundImage: 'url(bg.png)',
      backgroundRepeat: 'no-repeat',
      backgroundPosition: ['left', 'top'],
      backgroundSize: ['10px', '20px'],
      outlineWidth: 0,
      textDecorationLine: 'none'
    }))
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('condensed'))
  })

  it('reports unresolved variables, self percent bases and malformed calc expressions', () => {
    const error = jest.spyOn(console, 'error').mockImplementation(jest.fn())
    let result: ReturnType<typeof useTransformStyle> | undefined
    const style = {
      color: 'var(--missing)',
      fontSize: '50%',
      borderRadius: '10%',
      width: 'calc(foo)'
    }

    const Probe = () => {
      result = useTransformStyle(style, {
        enableVar: true,
        transformRadiusPercent: true
      })
      return <View testID="error-style-probe" style={result.normalStyle} />
    }

    render(<Probe />)

    expect(result?.normalStyle.color).toBeUndefined()
    expect(result?.normalStyle.fontSize).toBe('50%')
    expect(result?.hasSelfPercent).toBe(true)
    const errorMessages = error.mock.calls.map((args) => args.map(String).join(' '))
    expect(errorMessages.some((msg) => msg.includes('Can not resolve css var'))).toBe(true)
    expect(errorMessages.some((msg) => msg.includes('[fontSize] can not contain % unit'))).toBe(false)
    expect(errorMessages.some((msg) => msg.includes('calc(foo) parse error.'))).toBe(true)
  })

  it('updates layout refs and text pass-through hook values', () => {
    const setWidth = jest.fn()
    const setHeight = jest.fn()
    const onLayout = jest.fn()
    const propsOnLayout = jest.fn()
    // eslint-disable-next-line node/no-callback-literal
    const measure = jest.fn((callback) => callback(1, 4, 100, 80, 9, 12))
    let layoutResult: ReturnType<typeof useLayout> | undefined
    let passThroughResult: ReturnType<typeof useTextPassThrough> | undefined
    let resolvedTextStyle

    const Probe = () => {
      layoutResult = useLayout({
        props: {
          'enable-offset': true,
          onLayout: propsOnLayout
        },
        hasSelfPercent: true,
        setWidth,
        setHeight,
        onLayout,
        nodeRef: { current: { measure } } as any
      })
      passThroughResult = useTextPassThrough(
        { color: 'red' },
        { numberOfLines: 1 },
        { enableTextPassThrough: true }
      )
      resolvedTextStyle = resolveTextLineHeightPercentStyle(
        resolveTextFontSizePercentStyle({ fontSize: '150%', lineHeight: '200%' } as any, { fontSize: 12 })
      )
      return <View testID="layout-hook-probe" style={layoutResult.layoutStyle} onLayout={layoutResult.layoutProps.onLayout} />
    }

    render(
      <RouteContext.Provider value={{ pageId: 1, navigation: { layout: { top: 3 } } }}>
        <TextPassThroughContext.Provider value={{ textStyle: { lineHeight: 20 }, pendingTextProps: { selectable: true } }}>
          <Probe />
        </TextPassThroughContext.Provider>
      </RouteContext.Provider>
    )

    expect(layoutResult?.layoutStyle).toBeDefined()
    act(() => {
      layoutResult?.layoutProps.onLayout({
        nativeEvent: {
          layout: { width: 100, height: 80 }
        }
      })
    })

    expect(setWidth).toHaveBeenCalledWith(100)
    expect(setHeight).toHaveBeenCalledWith(80)
    expect(layoutResult?.layoutRef.current).toEqual({
      x: 1,
      y: 1,
      width: 100,
      height: 80,
      offsetLeft: 9,
      offsetTop: 9
    })
    expect(onLayout).toHaveBeenCalled()
    expect(propsOnLayout).toHaveBeenCalled()
    expect(passThroughResult).toEqual({
      textStyle: { lineHeight: 20, color: 'red' },
      pendingTextProps: { selectable: true, numberOfLines: 1 }
    })
    expect(resolvedTextStyle).toEqual({
      fontSize: 18,
      lineHeight: 36
    })
  })

  it('returns stable defaults for inactive layout and text pass-through hooks', () => {
    let layoutResult: ReturnType<typeof useLayout> | undefined
    let disabledPassThrough: ReturnType<typeof useTextPassThrough> | undefined
    let enabledPassThrough: ReturnType<typeof useTextPassThrough> | undefined
    const Probe = () => {
      layoutResult = useLayout({
        props: {},
        hasSelfPercent: false,
        nodeRef: { current: null }
      })
      disabledPassThrough = useTextPassThrough()
      enabledPassThrough = useTextPassThrough(undefined, undefined, { enableTextPassThrough: true })
      return null
    }

    render(<Probe />)

    expect(layoutResult).toEqual(expect.objectContaining({
      layoutStyle: undefined,
      layoutProps: {}
    }))
    expect(disabledPassThrough).toBeNull()
    expect(enabledPassThrough).toEqual({
      textStyle: undefined,
      pendingTextProps: undefined
    })
  })

  it('keeps disabled hover gestures from changing hover state', () => {
    jest.useFakeTimers()
    let hoverResult: ReturnType<typeof useHover> | undefined
    const gestureRef = { current: { id: 'scroll' } }

    const Probe = () => {
      hoverResult = useHover({
        enableHover: true,
        hoverStartTime: 10,
        hoverStayTime: 10,
        disabled: true
      })
      return <View testID="hover-hook-probe" />
    }

    render(
      <ScrollViewContext.Provider value={{ gestureRef } as any}>
        <Probe />
      </ScrollViewContext.Provider>
    )

    const gesture = hoverResult?.gesture as any
    act(() => {
      gesture.onTouchesDownCallback()
      jest.advanceTimersByTime(10)
      gesture.onTouchesUpCallback()
      jest.advanceTimersByTime(10)
    })

    expect(hoverResult?.isHover).toBe(false)
    expect(gesture.simultaneousWithExternalGesture).toHaveBeenCalledWith(gestureRef)
  })

  it('runs timing helpers and hook callbacks with stable cleanup behavior', () => {
    jest.useFakeTimers()

    const callback = jest.fn()
    const debounced = debounce(callback, 20)
    debounced('first')
    debounced('second')
    act(() => {
      jest.advanceTimersByTime(20)
    })
    expect(callback).toHaveBeenCalledWith('second')

    const clearedCallback = jest.fn()
    const clearedDebounced = debounce(clearedCallback, 20)
    clearedDebounced()
    clearedDebounced.clear()
    act(() => {
      jest.advanceTimersByTime(20)
    })
    expect(clearedCallback).not.toHaveBeenCalled()

    let hookResult: any
    const update = jest.fn()
    const HookProbe = ({ value }: { value: string }) => {
      const callbackMapRef = useRef({ fire: callback })
      useUpdateEffect(() => update(value), [value])
      hookResult = {
        previous: usePrevious(value),
        stable: useStableCallback(callback),
        debounced: useDebounceCallback(callback, 10),
        invoke: useRunOnJSCallback(callbackMapRef)
      }
      return null
    }

    const { rerender, unmount } = render(<HookProbe value="a" />)
    expect(hookResult.previous).toBeUndefined()
    expect(update).not.toHaveBeenCalled()

    rerender(<HookProbe value="b" />)
    expect(hookResult.previous).toBe('a')
    expect(update).toHaveBeenCalledWith('b')

    hookResult.stable('stable')
    hookResult.invoke('fire', 'invoked')
    hookResult.debounced('hook-debounced')
    act(() => {
      jest.advanceTimersByTime(10)
    })

    expect(callback).toHaveBeenCalledWith('stable')
    expect(callback).toHaveBeenCalledWith('invoked')
    expect(callback).toHaveBeenCalledWith('hook-debounced')
    unmount()
    expect(hookResult.invoke('fire')).toBeUndefined()
  })

  it('wraps children, renders image components and resolves current pages', () => {
    const wrapped = wrapChildren(<Text>child</Text>, {
      hasVarDec: true,
      varContext: { '--color': 'red' },
      textPassThrough: {
        textStyle: { color: 'red' },
        pendingTextProps: { numberOfLines: 1 }
      }
    })
    const slowImage = renderImage({ source: { uri: 'a.png' }, style: {} }, false)
    const fastImage = renderImage({ source: { uri: 'b.png' }, style: {} })
    const gesture = { current: true }
    const refGesture = { current: true }

    global.getCurrentPages = jest.fn(() => [
      { getPageId: () => 1, name: 'home' },
      { getPageId: () => 2, name: 'detail' }
    ])

    expect(React.isValidElement(wrapped)).toBe(true)
    expect(slowImage.type).toBe(Image)
    expect((fastImage.props as any).source).toEqual({ uri: 'b.png' })
    expect(flatGesture([
      gesture,
      {
        nodeRefs: [
          { getNodeInstance: () => ({ instance: { gestureRef: refGesture } }) },
          { getNodeInstance: () => null }
        ]
      }
    ])).toEqual([gesture, refGesture, {}])
    expect(getCurrentPage(2)).toEqual({ getPageId: expect.any(Function), name: 'detail' })
  })

  it('covers helper defaults, fallback values and direct transform variants', () => {
    const previousMpx = global.__mpx
    const previousGetCurrentPages = global.getCurrentPages
    const defaultStyle = Object.create({ inherited: 1 })
    defaultStyle.minWidth = 10
    let result: ReturnType<typeof useTransformStyle> | undefined

    try {
      global.__mpx = {} as any
      expect(getRestProps()).toEqual({})
      expect(getDefaultAllowFontScaling()).toBe(false)
      expect(pickStyle(undefined as any, [])).toEqual({})
      expect(isText(React.createElement('Text'))).toBe(false)
      expect(flatGesture(undefined as any)).toEqual([])
      expect(flatGesture([{ handlerTag: 0 }, {}])).toEqual([{ handlerTag: 0 }])

      const Probe = () => {
        result = useTransformStyle({
          color: 'var(--missing, red)',
          paddingTop: 'env(unknown-inset)',
          rowGap: '50%',
          columnGap: '25%',
          transform: 'translateX(1px) translateY(2px) scaleX(3) scaleY(4) perspective(5px)',
          fontWeight: 0,
          transformOrigin: null
        }, {
          enableVar: true,
          parentWidth: 100,
          parentHeight: 200,
          defaultStyle
        })
        return <View testID="fallback-style-probe" style={result.normalStyle} />
      }
      render(<Probe />)

      expect(result?.normalStyle).toEqual(expect.objectContaining({
        color: 'red',
        paddingTop: '',
        rowGap: 100,
        columnGap: 25,
        minWidth: 10,
        fontWeight: '0',
        transformOrigin: null,
        transform: [
          { translateX: 1 },
          { translateY: 2 },
          { scaleX: 3 },
          { scaleY: 4 },
          { perspective: 5 }
        ]
      }))
      expect(result?.normalStyle).not.toHaveProperty('inherited')

      global.getCurrentPages = jest.fn(() => [
        { name: 'invalid' },
        { getPageId: () => 3, name: 'valid' }
      ])
      expect(getCurrentPage(3)).toEqual({ getPageId: expect.any(Function), name: 'valid' })
    } finally {
      global.__mpx = previousMpx
      global.getCurrentPages = previousGetCurrentPages
    }
  })

  it('reports stable hook feature changes and handles empty layout events', () => {
    const error = jest.spyOn(console, 'error').mockImplementation(jest.fn())
    const setWidth = jest.fn()
    const setHeight = jest.fn()
    let layoutResult: ReturnType<typeof useLayout> | undefined
    let styleResult: ReturnType<typeof useTransformStyle> | undefined
    let passThroughResult: ReturnType<typeof useTextPassThrough> | undefined

    const Probe = ({ active }: { active: boolean }) => {
      styleResult = useTransformStyle(active ? { '--color': 'red' } : {}, {})
      passThroughResult = useTextPassThrough(active ? { color: 'red' } : undefined)
      layoutResult = useLayout({
        props: {},
        hasSelfPercent: true,
        setWidth,
        setHeight,
        nodeRef: { current: null }
      })
      return <View testID="stable-feature-probe" onLayout={layoutResult.layoutProps.onLayout} />
    }

    const { rerender } = render(<Probe active={false} />)
    act(() => {
      layoutResult?.layoutProps.onLayout(undefined as any)
    })
    expect(setWidth).toHaveBeenCalledWith(0)
    expect(setHeight).toHaveBeenCalledWith(0)

    rerender(<Probe active={true} />)
    expect(styleResult?.hasVarDec).toBe(true)
    expect(passThroughResult).toBeNull()
    expect(error).toHaveBeenCalledWith(expect.stringContaining('css variable use/declare should be stable'))
    expect(error).toHaveBeenCalledWith(expect.stringContaining('text style/props use should be stable'))
  })

  it('handles enabled hover timer replacement and optional stable callbacks', () => {
    jest.useFakeTimers()
    let hoverResult: ReturnType<typeof useHover> | undefined
    let stableCallback: ReturnType<typeof useStableCallback>

    const Probe = () => {
      hoverResult = useHover({
        enableHover: true,
        hoverStartTime: 10,
        hoverStayTime: 20
      })
      stableCallback = useStableCallback(undefined)
      return null
    }

    const { unmount } = render(<Probe />)
    const gesture = hoverResult?.gesture as any
    act(() => {
      gesture.onTouchesDownCallback()
      gesture.onTouchesDownCallback()
    })
    expect(jest.getTimerCount()).toBe(1)
    act(() => {
      jest.advanceTimersByTime(10)
    })
    expect(hoverResult?.isHover).toBe(true)
    act(() => {
      gesture.onTouchesUpCallback()
      gesture.onTouchesUpCallback()
    })
    expect(jest.getTimerCount()).toBe(1)
    act(() => {
      jest.advanceTimersByTime(20)
    })
    expect(hoverResult?.isHover).toBe(false)
    expect(stableCallback()).toBeUndefined()
    unmount()
  })
})
