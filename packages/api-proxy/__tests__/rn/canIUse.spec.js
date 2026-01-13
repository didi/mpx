// 测试 RN 环境下的 canIUse 函数
import { canIUse } from '../../src/platform/api/base/rnCanIUse'

describe('canIUse for RN', () => {
  test('should support basic APIs', () => {
    expect(canIUse('navigateTo')).toBe(true)
    expect(canIUse('showToast')).toBe(true)
    expect(canIUse('request')).toBe(true)
    expect(canIUse('getSystemInfo')).toBe(true)
    expect(canIUse('vibrateShort')).toBe(true)
    expect(canIUse('getStorage')).toBe(true)
  })

  test('should return false for unsupported APIs', () => {
    expect(canIUse('someUnsupportedApi')).toBe(false)
    expect(canIUse('wx.someMethod')).toBe(false)
    expect(canIUse('nonExistentApi')).toBe(false)
    expect(canIUse('undefinedMethod')).toBe(false)
  })

  test('should support API with methods', () => {
    expect(canIUse('request.success')).toBe(true)
    expect(canIUse('showModal.success.confirm')).toBe(true)
  })

  test('should support object methods', () => {
    expect(canIUse('SelectorQuery')).toBe(true)
    expect(canIUse('SelectorQuery.select')).toBe(true)
    expect(canIUse('Animation.rotate')).toBe(true)

    // 测试 Task 类的方法
    expect(canIUse('SocketTask')).toBe(true)
    expect(canIUse('SocketTask.send')).toBe(true)
    expect(canIUse('SocketTask.onMessage')).toBe(true)
    expect(canIUse('RequestTask')).toBe(true)
    expect(canIUse('RequestTask.abort')).toBe(true)
  })

  test('should handle invalid input', () => {
    expect(canIUse(null)).toBe(false)
    expect(canIUse(undefined)).toBe(false)
    expect(canIUse(123)).toBe(false)
  })

  test('should handle ${} syntax', () => {
    expect(canIUse('$' + '{navigateTo}')).toBe(false)
    expect(canIUse('$' + '{showToast}')).toBe(false)
  })

  test('should dynamically detect APIs from platform exports', () => {
    // 测试一些从 platform 导出的 API
    expect(canIUse('base64ToArrayBuffer')).toBe(true)
    expect(canIUse('arrayBufferToBase64')).toBe(true)

    // 测试 create* 函数
    expect(canIUse('createAnimation')).toBe(true)
    expect(canIUse('createSelectorQuery')).toBe(true)
    expect(canIUse('createIntersectionObserver')).toBe(true)
  })
})
