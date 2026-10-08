/// <reference types="jest" />

const mockKeyboardListeners: Record<string, (evt?: any) => void> = {}
const mockUseContext = jest.fn()
const mockUseEffect = jest.fn((effect: () => void) => effect())

jest.mock('react-native', () => ({
  Keyboard: {
    addListener: jest.fn((event: string, listener: (evt?: any) => void) => {
      mockKeyboardListeners[event] = listener
      return { remove: jest.fn() }
    }),
    isVisible: jest.fn(() => false),
    dismiss: jest.fn()
  },
  View: 'View'
}), { virtual: false })

jest.mock('react-native-reanimated', () => ({
  __esModule: true,
  default: { View: 'AnimatedView' },
  useSharedValue: (value: any) => ({ value }),
  useAnimatedStyle: (factory: () => any) => factory(),
  withTiming: (value: any) => value,
  Easing: {
    ease: 'ease',
    quad: 'quad',
    inOut: (value: any) => value,
    out: (value: any) => value
  },
  cancelAnimation: jest.fn()
}), { virtual: false })

jest.mock('react', () => {
  const actual = jest.requireActual('react')
  return Object.assign({}, actual, {
    useContext: (...args: any[]) => mockUseContext(...args),
    useEffect: (effect: () => void) => mockUseEffect(effect),
    useRef: (value: any) => ({ current: value })
  })
})

jest.mock('../../../lib/runtime/components/react/utils', () => ({
  isAndroid: true,
  isIOS: false
}))

// eslint-disable-next-line import/first
import KeyboardAvoidingView from '../../../lib/runtime/components/react/mpx-keyboard-avoiding-view'

const keyboardShowEvent = {
  endCoordinates: {
    height: 300,
    screenY: 500
  }
}

const createInput = () => ({
  blur: jest.fn(),
  isFocused: jest.fn(() => true)
})

const renderKeyboardAvoidingView = (input: ReturnType<typeof createInput>) => {
  const keyboardAvoid = {
    current: {
      cursorSpacing: 0,
      ref: { current: input },
      adjustPosition: false
    } as any
  }
  mockUseContext.mockReturnValue(keyboardAvoid)
  ;(KeyboardAvoidingView as any)({})
  return keyboardAvoid
}

describe('MpxKeyboardAvoidingView RN runtime', () => {
  beforeEach(() => {
    Object.keys(mockKeyboardListeners).forEach((event) => delete mockKeyboardListeners[event])
    mockUseContext.mockReset()
    mockUseEffect.mockClear()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  test('blurs the focused input when Android keyboard is dismissed', () => {
    const input = createInput()
    renderKeyboardAvoidingView(input)

    mockKeyboardListeners.keyboardDidShow(keyboardShowEvent)
    mockKeyboardListeners.keyboardDidHide()

    expect(input.blur).toHaveBeenCalledTimes(1)
  })

  test('does not blur the new input during the input switch guard period', () => {
    jest.spyOn(Date, 'now').mockReturnValue(1050)
    const oldInput = createInput()
    const keyboardAvoid = renderKeyboardAvoidingView(oldInput)
    mockKeyboardListeners.keyboardDidShow(keyboardShowEvent)

    const newInput = createInput()
    keyboardAvoid.current = {
      cursorSpacing: 0,
      ref: { current: newInput },
      adjustPosition: false,
      preventBlurUntil: 1100
    }
    mockKeyboardListeners.keyboardDidHide()

    expect(newInput.blur).not.toHaveBeenCalled()
  })

  test('blurs the new input after the guard period without another keyboard show event', () => {
    jest.spyOn(Date, 'now').mockReturnValue(1100)
    const oldInput = createInput()
    const keyboardAvoid = renderKeyboardAvoidingView(oldInput)
    mockKeyboardListeners.keyboardDidShow(keyboardShowEvent)

    const newInput = createInput()
    keyboardAvoid.current = {
      cursorSpacing: 0,
      ref: { current: newInput },
      adjustPosition: false,
      preventBlurUntil: 1100
    }
    mockKeyboardListeners.keyboardDidHide()

    expect(newInput.blur).toHaveBeenCalledTimes(1)
  })
})
