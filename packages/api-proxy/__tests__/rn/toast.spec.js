import Portal from '@mpxjs/webpack-plugin/lib/runtime/components/react/dist/mpx-portal/index'
import { showToast, showLoading } from '../../src/platform/api/toast/rnToast'

jest.mock('react-native', () => ({
  View: 'View',
  Text: 'Text',
  Image: 'Image',
  ActivityIndicator: 'ActivityIndicator',
  StyleSheet: {
    create: jest.fn(styles => styles)
  },
  Dimensions: {
    get: jest.fn(() => ({ height: 800 }))
  }
}), { virtual: true })

jest.mock('@mpxjs/webpack-plugin/lib/runtime/components/react/dist/mpx-portal/index', () => ({
  add: jest.fn(),
  remove: jest.fn()
}))

describe('RN toast APIs', () => {
  test.each([
    ['showToast', showToast],
    ['showLoading', showLoading]
  ])('%s should fail when title is missing', (apiName, api) => {
    const success = jest.fn()
    const fail = jest.fn()
    const complete = jest.fn()

    api({ success, fail, complete })

    const result = {
      errMsg: `${apiName}:fail parameter error: parameter.title should be String instead of Undefined;`,
      errno: 1001
    }
    expect(success).not.toHaveBeenCalled()
    expect(fail).toHaveBeenCalledWith(result)
    expect(complete).toHaveBeenCalledWith(result)
    expect(Portal.add).not.toHaveBeenCalled()
  })
})
