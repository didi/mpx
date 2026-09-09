/// <reference types="jest" />

jest.mock('react-native', () => ({
  StyleSheet: { hairlineWidth: 1 / 3 },
  Image: class Image {}
}), { virtual: false })

jest.mock('react-native-gesture-handler', () => ({
  Gesture: { Tap: () => ({}), Pan: () => ({}), LongPress: () => ({}) }
}), { virtual: false })

jest.mock('react-native-safe-area-context', () => ({
  initialWindowMetrics: { insets: { top: 0, right: 0, bottom: 0, left: 0 } }
}), { virtual: false })

// eslint-disable-next-line import/first
import { splitProps, splitStyle } from '../../../lib/runtime/components/react/utils'

describe('runtime splitStyle', () => {
  test('reuses the original style object when no text/background style exists', () => {
    const style = { width: 100, height: 50 }
    const visited: string[] = []
    const result = splitStyle(style, key => visited.push(key))

    expect(result.innerStyle).toBe(style)
    expect(result.textStyle).toBeUndefined()
    expect(result.backgroundStyle).toBeUndefined()
    expect(visited).toEqual(['width', 'height'])
  })

  test('copies keys before the first special style only when a special style exists', () => {
    const style = {
      width: 100,
      backgroundImage: 'url(https://example.com/a.png)',
      height: 50,
      color: 'red'
    }
    const result = splitStyle(style)

    expect(result.innerStyle).toEqual({ width: 100, height: 50 })
    expect(result.backgroundStyle).toEqual({ backgroundImage: 'url(https://example.com/a.png)' })
    expect(result.textStyle).toEqual({ color: 'red' })
  })

  test('copies all leading inner styles when the first special style is at the end', () => {
    const style = { width: 100, height: 50, color: 'red' }
    const result = splitStyle(style)

    expect(result.innerStyle).toEqual({ width: 100, height: 50 })
    expect(result.textStyle).toEqual({ color: 'red' })
  })
})

describe('runtime splitProps', () => {
  test('reuses the original props object when no text prop exists', () => {
    const props = { id: 'view', accessible: true }
    const result = splitProps(props)

    expect(result.innerProps).toBe(props)
    expect(result.textProps).toBeUndefined()
  })

  test('copies props before the first text prop only when a text prop exists', () => {
    const onPress = jest.fn()
    const props = {
      id: 'view',
      numberOfLines: 1,
      onPress,
      ellipsizeMode: 'tail'
    }
    const result = splitProps(props)

    expect(result.innerProps).toEqual({ id: 'view', onPress })
    expect(result.textProps).toEqual({ numberOfLines: 1, ellipsizeMode: 'tail' })
  })
})
