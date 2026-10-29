import { resolveNumericValue } from '../../../lib/runtime/components/react/utils'

jest.mock('react-native-gesture-handler', () => ({
  Gesture: {}
}))

jest.mock('react-native-safe-area-context', () => ({
  initialWindowMetrics: { insets: { top: 0, right: 0, bottom: 0, left: 0 } }
}))

describe('RN style error reporting and numeric props', () => {
  const mockGlobal = global as any

  beforeEach(() => {
    jest.spyOn(mockGlobal.__mpx.config, 'errorHandler')
    mockGlobal.__mpxAppCbs = { error: [jest.fn()] }
  })

  afterEach(() => {
    jest.restoreAllMocks()
    delete mockGlobal.__mpxAppCbs
  })

  test.each([null, Infinity])('recovers an invalid numeric prop %s to zero and reports it', (value) => {
    expect(resolveNumericValue(value, 'x')).toBe(0)
    expect(mockGlobal.__mpx.config.errorHandler).toHaveBeenCalledTimes(1)
    expect(mockGlobal.__mpx.config.errorHandler).toHaveBeenCalledWith(
      `Invalid numeric value [${value}] for [x], using 0.`, undefined, expect.any(Error)
    )
    expect(mockGlobal.__mpxAppCbs.error[0]).not.toHaveBeenCalled()
  })

  test('preserves zero and converts numeric strings', () => {
    expect(resolveNumericValue(0, 'x')).toBe(0)
    expect(resolveNumericValue('12', 'x')).toBe(12)
    expect(mockGlobal.__mpx.config.errorHandler).not.toHaveBeenCalled()
  })
})
