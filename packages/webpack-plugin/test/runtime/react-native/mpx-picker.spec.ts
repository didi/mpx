/// <reference types="jest" />

const mockOpen = jest.fn()
const mockShow = jest.fn()
const mockHide = jest.fn()
const mockRemove = jest.fn()
const mockUpdate = jest.fn()

jest.mock('react-native', () => ({
  StyleSheet: {
    hairlineWidth: 1 / 3,
    create: (style: any) => style
  },
  Text: 'Text',
  TouchableWithoutFeedback: 'TouchableWithoutFeedback',
  View: 'View'
}), { virtual: false })

jest.mock('react-native-gesture-handler', () => ({
  Gesture: { Tap: () => ({}), Pan: () => ({}), LongPress: () => ({}) }
}), { virtual: false })

jest.mock('react-native-safe-area-context', () => ({
  initialWindowMetrics: { insets: { top: 0, right: 0, bottom: 0, left: 0 } }
}), { virtual: false })

jest.mock('react', () => {
  const actual = jest.requireActual('react')
  return Object.assign({}, actual, {
    forwardRef: (render: any) => render,
    createElement: jest.fn((type: any, props: any, ...children: any[]) => ({ type, props: props || {}, children })),
    useCallback: (fn: any) => fn,
    useContext: jest.fn(() => null),
    useEffect: (effect: any) => effect(),
    useImperativeHandle: () => undefined,
    useMemo: (factory: any) => factory(),
    useRef: (init: any) => ({ current: init }),
    useState: (init: any) => [typeof init === 'function' ? init() : init, () => undefined]
  })
})

jest.mock('../../../lib/runtime/components/react/mpx-popup', () => ({
  createPopupManager: () => ({
    open: mockOpen,
    show: mockShow,
    hide: mockHide,
    update: mockUpdate,
    remove: mockRemove
  })
}))

jest.mock('../../../lib/runtime/components/react/mpx-picker/selector', () => ({
  __esModule: true,
  default: 'PickerSelector'
}))

jest.mock('../../../lib/runtime/components/react/mpx-picker/multiSelector', () => ({
  __esModule: true,
  default: 'PickerMultiSelector'
}))

jest.mock('../../../lib/runtime/components/react/mpx-picker/time', () => ({
  __esModule: true,
  default: 'PickerTime'
}))

jest.mock('../../../lib/runtime/components/react/mpx-picker/date', () => ({
  __esModule: true,
  default: 'PickerDate'
}))

jest.mock('../../../lib/runtime/components/react/mpx-picker/region', () => ({
  __esModule: true,
  default: 'PickerRegion'
}))

// eslint-disable-next-line import/first
import Picker from '../../../lib/runtime/components/react/mpx-picker'
// eslint-disable-next-line import/first
import { PickerMode } from '../../../lib/runtime/components/react/mpx-picker/type'
// eslint-disable-next-line import/first
import { TextPassThroughContext } from '../../../lib/runtime/components/react/context'

const findElementByType = (element: any, type: any): any => {
  if (!element) return null
  if (Array.isArray(element)) {
    let matched = null
    element.some((item) => {
      matched = findElementByType(item, type)
      return !!matched
    })
    return matched
  }
  if (element.type === type) return element
  return findElementByType(element.props?.children || element.children, type)
}

describe('MpxPicker RN runtime', () => {
  beforeEach(() => {
    mockOpen.mockClear()
    mockShow.mockClear()
    mockHide.mockClear()
    mockRemove.mockClear()
    mockUpdate.mockClear()
  })

  test('passes range to selector popup content after filtering root props', () => {
    const range = ['Beijing', 'Shanghai', 'Guangzhou']
    const result = (Picker as any)({
      mode: PickerMode.SELECTOR,
      value: 1,
      range,
      children: 'Select'
    }, null)

    const popupContent = mockOpen.mock.calls[0][0]
    const selector = findElementByType(popupContent, 'PickerSelector')
    const triggerView = findElementByType(result, 'View')

    expect(selector.props.range).toBe(range)
    expect(triggerView.props.range).toBeUndefined()
  })

  test('defaults omitted selector range to empty array', () => {
    const result = (Picker as any)({
      mode: PickerMode.SELECTOR,
      value: 0,
      children: 'Select'
    }, null)

    const popupContent = mockOpen.mock.calls[0][0]
    const selector = findElementByType(popupContent, 'PickerSelector')
    const triggerView = findElementByType(result, 'View')

    expect(selector.props.range).toEqual([])
    expect(triggerView.props.range).toBeUndefined()
  })

  test('updates selector popup content before next open when range changes', () => {
    const range = ['Beijing', 'Shanghai']
    ;(Picker as any)({
      mode: PickerMode.SELECTOR,
      value: 0,
      range: [],
      children: 'Select'
    }, null)
    const result = (Picker as any)({
      mode: PickerMode.SELECTOR,
      value: 0,
      range,
      children: 'Select'
    }, null)

    expect(mockUpdate).not.toHaveBeenCalled()
    result.props.onPress()

    const popupContent = mockUpdate.mock.calls[mockUpdate.mock.calls.length - 1][0]
    const selector = findElementByType(popupContent, 'PickerSelector')

    expect(selector.props.range).toBe(range)
  })

  test('passes text style through to trigger children', () => {
    const result = (Picker as any)({
      mode: PickerMode.SELECTOR,
      value: 0,
      range: ['Beijing'],
      style: {
        width: 100,
        color: 'red',
        fontSize: 20
      },
      children: 'Select'
    }, null)

    const triggerView = findElementByType(result, 'View')
    const textProvider = findElementByType(triggerView, TextPassThroughContext.Provider)

    expect(triggerView.props.style).toEqual({ width: 100 })
    expect(textProvider.props.value.textStyle).toEqual({
      color: 'red',
      fontSize: 20
    })
  })
})
