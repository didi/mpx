import SocketTask from '../../src/platform/api/socket/SocketTask'

describe('SocketTask', () => {
  const NativeWebSocket = global.WebSocket

  afterEach(() => {
    global.WebSocket = NativeWebSocket
  })

  test('reports the actual CloseEvent after close is requested', () => {
    const close = jest.fn()
    global.WebSocket = jest.fn(function () {
      this.close = close
      this.readyState = 1
    })
    const socketTask = new SocketTask('ws://localhost')
    const onClose = jest.fn()

    socketTask.onClose(onClose)
    socketTask.close({ code: 1000, reason: 'normal closure' })
    // close 入参只是关闭请求，回调应以服务端最终返回的 CloseEvent 为准。
    socketTask._socket.onclose({ code: 1006, reason: '' })

    expect(close).toHaveBeenCalledWith(1000, 'normal closure')
    expect(onClose).toHaveBeenCalledWith({ code: 1006, reason: '' })
  })
})
