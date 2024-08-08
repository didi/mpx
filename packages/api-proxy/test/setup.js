/**
 * 仅用做api-proxy中抹平测试用，后续有需要可以完善方法体系
 */

global.getCurrentPages = function () {
  return [{
    $el: document.body
  }]
}

jest.mock('@mpxjs/core', () => ({
  isRef: jest.fn(),
  isReactive: jest.fn()
}))
