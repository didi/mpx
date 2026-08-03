import { connectSocket } from '../../src/platform/api/socket/index.ios'
import { connectSocket as connectSocketWeb } from '../../src/platform/api/socket/index.web'

class MockWebSocket {
  constructor (url, protocols, options) {
    this.url = url
    this.protocols = protocols
    this.options = options
    this.readyState = 0
    this.CONNECTING = 0
    this.OPEN = 1
    this.CLOSING = 2
    this.CLOSED = 3
    this.close = jest.fn()
  }
}

describe('RN connectSocket', () => {
  beforeEach(() => {
    global.WebSocket = jest.fn((...args) => new MockWebSocket(...args))
  })

  it('should forward header and protocols to WebSocket', () => {
    const header = {
      Authorization: 'token'
    }

    connectSocket({
      url: 'wss://example.com',
      protocols: ['chat'],
      header
    })

    expect(global.WebSocket).toHaveBeenCalledWith(
      'wss://example.com',
      ['chat'],
      {
        headers: header
      }
    )
  })

  it('should not forward header options on web', () => {
    connectSocketWeb({
      url: 'wss://example.com',
      header: {
        Authorization: 'token'
      }
    })

    expect(global.WebSocket).toHaveBeenCalledWith('wss://example.com')
  })
})
