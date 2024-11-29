import { getNetworkType } from '../../src/platform/api/device/network/index.web'

describe('test getNetworkType', () => {
  test('should be enums value', () => {
    getNetworkType(function ({ networkType }) {
      expect(['wifi', '2g', '3g', '4g', '5g', 'unknown', 'none'].includes(networkType)).toBe(true)
    })
  })
})
// todo complete unit tests
