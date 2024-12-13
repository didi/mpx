import { successHandle, failHandle, warn } from '../../../common/js'
const { WebSocket } = __GLOBAL__

class SocketTask {
  constructor (url, protocols) {
    this._openCb = null
    this._closeCb = null
    this._messageCb = null
    this._errorCb = null
    this._closeData = null

    WebSocket.connect(url)
    this.addListener(WebSocket)
  }

  get CONNECTING () {
    warn('不支持CONNECTING')
  }

  get OPEN () {
    warn('不支持OPEN')
  }

  get CLOSING () {
    warn('不支持CLOSING')
  }

  get CLOSED () {
    warn('不支持CLOSED')
  }

  get readyState () {
    warn('不支持readyState')
  }

  send (options) {
    // todo fail options needs tobe convert
    // const { data = '', success, fail, complete } = options
    const { data = '', success, complete } = options
    WebSocket.send(data)
    const res = { errMsg: 'sendSocketMessage:ok' }
    successHandle(res, success, complete)
    return Promise.resolve(res)
  }

  close (options) {
    const { code = 1000, reason = '', success, fail, complete } = options
    this._closeData = {
      code,
      reason
    }
    try {
      WebSocket.close()
      const res = { errMsg: 'closeSocket:ok' }
      successHandle(res, success, complete)
      return Promise.resolve(res)
    } catch (err) {
      const res = { errMsg: `closeSocket:fail ${err}` }
      failHandle(res, fail, complete)
      if (!fail) {
        return Promise.reject(res)
      }
    }
  }

  addListener (socket) {
    socket.onOpen((event) => {
      typeof this._openCb === 'function' && this._openCb(event)
    })
    socket.onMessage((event) => {
      typeof this._messageCb === 'function' && this._messageCb(event)
    })
    socket.onError((event) => {
      typeof this._errorCb === 'function' && this._errorCb(event)
    })
    socket.onClose((event) => {
      if (typeof this._closeCb !== 'function') {
        return
      }
      if (this._closeData) {
        this._closeCb(event)
      } else {
        this._closeCb({ code: 2000, reason: `${event}` })
      }
    })
  }

  onOpen (cb) {
    this._openCb = cb
  }

  onMessage (cb) {
    this._messageCb = cb
  }

  onError (cb) {
    this._errorCb = cb
  }

  onClose (cb) {
    this._closeCb = cb
  }
}

export default SocketTask
