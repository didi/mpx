/// <reference types="jest" />

const mockError = jest.fn()
const mockUseAnimationAPIHooks = jest.fn()
const mockUseTransitionHooks = jest.fn(() => ({ opacity: 1 }))

jest.mock('@mpxjs/utils', () => ({
  collectDataset: jest.fn(),
  error: (...args: any[]) => mockError(...args),
  hasOwn: (obj: object, key: string) => Object.prototype.hasOwnProperty.call(obj, key)
}))

jest.mock('react', () => ({
  useRef: (init: any) => ({ current: init })
}))

jest.mock('../../../lib/runtime/components/react/animationHooks/useAnimationAPIHooks', () => ({
  __esModule: true,
  default: (...args: any[]) => mockUseAnimationAPIHooks(...args)
}))

jest.mock('../../../lib/runtime/components/react/animationHooks/useTransitionHooks', () => ({
  __esModule: true,
  default: (...args: any[]) => mockUseTransitionHooks(...args)
}))

// eslint-disable-next-line import/first
import useAnimationHooks from '../../../lib/runtime/components/react/animationHooks/index'

const layoutRef = { current: null }

describe('useAnimationHooks animation type detection', () => {
  beforeEach(() => {
    mockError.mockClear()
    mockUseAnimationAPIHooks.mockClear()
    mockUseTransitionHooks.mockClear()
  })

  test('detects CSS animation from animationName without animationDuration', () => {
    const result = useAnimationHooks({
      style: { animationName: 'fade-in' },
      layoutRef
    })

    expect(result).toEqual({ enableStyleAnimation: false })
    expect(mockError).toHaveBeenCalledWith('[Mpx runtime error]: CSS animation is not supported yet')
    expect(mockUseAnimationAPIHooks).not.toHaveBeenCalled()
    expect(mockUseTransitionHooks).not.toHaveBeenCalled()
  })

  test('detects CSS transition from transitionProperty without transitionDuration', () => {
    const style = { transitionProperty: 'opacity' }
    const result = useAnimationHooks({ style, layoutRef })

    expect(result).toEqual({
      enableStyleAnimation: true,
      animationStyle: { opacity: 1 }
    })
    expect(mockUseTransitionHooks).toHaveBeenCalledWith({ style })
    expect(mockUseAnimationAPIHooks).not.toHaveBeenCalled()
    expect(mockError).not.toHaveBeenCalled()
  })
})
