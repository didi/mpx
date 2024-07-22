import { getNetworkType } from '../../src/platform/api/device/network/index.web'

jest.mock('@mpxjs/core', () => ({
  isRef: jest.fn(),
  isReactive: jest.fn()
}))

describe('test getNetworkType', () => {
  test('should be enums value', () => {
    getNetworkType(function ({ networkType }) {
      expect(['wifi', '2g', '3g', '4g', '5g', 'unknown', 'none'].includes(networkType)).toBe(true)
    })
  })
})
// todo complete unit tests
