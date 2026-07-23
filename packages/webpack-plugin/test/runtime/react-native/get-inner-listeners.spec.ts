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

jest.mock('@mpxjs/utils', () => ({
  collectDataset: jest.fn()
}))

jest.mock('../../../lib/runtime/components/react/utils', () => ({
  extendObject: Object.assign,
  useNavigation: () => ({})
}))

// eslint-disable-next-line import/first
import {
  isLabelControlHandled,
  markLabelControlHandled
} from '../../../lib/runtime/components/react/getInnerListeners'

describe('label control event handling', () => {
  test('shares the handled state between shallow event copies', () => {
    const nativeEvent = {}
    const checkboxEvent = { nativeEvent } as any
    const labelEvent = Object.assign({}, checkboxEvent)

    markLabelControlHandled(checkboxEvent)

    expect(isLabelControlHandled(labelEvent)).toBe(true)
  })

  test('does not share the handled state between different native events', () => {
    const checkboxEvent = { nativeEvent: {} } as any
    const nextLabelEvent = { nativeEvent: {} } as any

    markLabelControlHandled(checkboxEvent)

    expect(isLabelControlHandled(nextLabelEvent)).toBe(false)
  })
})
