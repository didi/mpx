import CameraContext from '../../src/platform/api/camera/rnCamera'

describe('RN CameraContext', () => {
  test('setZoom should invoke fail only when the native method throws', () => {
    const cameraContext = new CameraContext()
    const success = jest.fn()
    const fail = jest.fn()
    const complete = jest.fn()
    cameraContext.camera = {
      setZoom: jest.fn(() => {
        throw new Error('set zoom failed')
      })
    }

    cameraContext.setZoom({
      zoom: 2,
      success,
      fail,
      complete
    })

    expect(cameraContext.camera.setZoom).toHaveBeenCalledWith(2)
    expect(success).not.toHaveBeenCalled()
    expect(fail).toHaveBeenCalledWith({
      errMsg: 'setZoom:fail set zoom failed'
    })
    expect(complete).toHaveBeenCalledTimes(1)
    expect(complete).toHaveBeenCalledWith({
      errMsg: 'setZoom:fail set zoom failed'
    })
  })
})
