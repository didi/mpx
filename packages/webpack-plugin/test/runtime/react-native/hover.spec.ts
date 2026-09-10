/// <reference types="jest" />

jest.mock('react', () => {
  const actual = jest.requireActual('react')
  return Object.assign({}, actual, {
    createElement: (type: unknown, props: unknown, children: unknown) => ({ type, props, children }),
    forwardRef: (render: any) => render,
    useCallback: (callback: any) => callback
  })
})

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

jest.mock('@mpxjs/api-proxy', () => ({
  redirectTo: jest.fn(),
  navigateTo: jest.fn(),
  navigateBack: jest.fn(),
  reLaunch: jest.fn(),
  switchTab: jest.fn()
}))

jest.mock('../../../lib/runtime/components/react/mpx-view', () => ({
  __esModule: true,
  default: 'MpxView'
}))

// eslint-disable-next-line import/first
import Navigator from '../../../lib/runtime/components/react/mpx-navigator'

describe('RN hover support', () => {
  const hoverStyle = { opacity: 0.8 }

  it('should pass navigator view props to its view', () => {
    const viewProps = {
      'hover-class': 'none',
      'hover-style': hoverStyle,
      'hover-start-time': 20,
      'hover-stay-time': 70,
      id: 'navigator',
      style: { color: 'red' }
    }
    const renderNavigator = Navigator as unknown as (props: Record<string, any>, ref: string) => Record<string, any>

    const element = renderNavigator(Object.assign({
      children: 'content',
      'open-type': 'navigate',
      url: '/pages/home',
      delta: 1
    }, viewProps), 'navigator-ref')

    expect(element).toEqual({
      type: 'MpxView',
      props: expect.objectContaining(viewProps),
      children: 'content'
    })
    expect(element.props).not.toHaveProperty('children')
    expect(element.props).not.toHaveProperty('open-type')
    expect(element.props).not.toHaveProperty('url')
    expect(element.props).not.toHaveProperty('delta')
  })
})
