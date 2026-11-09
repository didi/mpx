import { ENV_OBJ } from '../../src/common/js'
import { setNavigationBarTitle } from '../../src/platform/api/set-navigation-bar/index.ali'

jest.mock('../../src/common/js/index', () => {
  const actual = jest.requireActual('../../src/common/js/index')
  return Object.assign({}, actual, {
    ENV_OBJ: {
      canIUse: jest.fn(() => true),
      setNavigationBarTitle: jest.fn()
    }
  })
})

describe('Ali setNavigationBarTitle', () => {
  test('should normalize the success errMsg', () => {
    const success = jest.fn()
    ENV_OBJ.setNavigationBarTitle.mockImplementation(({ success }) => {
      success({})
    })

    setNavigationBarTitle({
      title: 'title',
      success
    })

    expect(success).toHaveBeenCalledWith({
      errMsg: 'setNavigationBarTitle:ok'
    })
  })
})
