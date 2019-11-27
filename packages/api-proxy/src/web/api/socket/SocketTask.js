import { webHandleSuccess, webHandleFail } from '../../common/js'

const socketTasks = new Set()

class SocketTask {
  constructor (url, protocols) {
    this._openCb = null
    this._closeCb = null
    this._messageCb = null
    this._errorCb = null
    this._closeData = null

    if (protocols && protocols.length > 0) {
      this._socket = new window.WebSocket(url, protocols)
    } else {
      this._socket = new window.WebSocket(url)
    }
    this.addListener(this._socket)
    socketTasks.add(this._socket)
  }

  get CONNECTING () {
    return this._socket['CONNECTING'] || 0
  }

  get OPEN () {
    return this._socket['OPEN'] || 1
  }

  get CLOSING () {
    return this._socket['CLOSING'] || 2
  }

  get CLOSED () {
    return this._socket['CLOSED'] || 3
  }

  get readyState () {
    return this._socket['readyState']
  }

  send (options) {
    const { data = '', success, fail, complete } = options

    if (this._socket.readyState === 1) {
      this._socket.send(data)
      const res = { errMsg: 'sendSocketMessage:ok' }
      webHandleSuccess(res, success, complete)
      return Promise.resolve(res)
    } else {
      const res = { errMsg: 'sendSocketMessage:fail' }
      webHandleFail(res, fail, complete)
      if (!fail) {
        return Promise.reject(res)
      }
    }
  }

  close (options) {
    const { code = 1000, reason = '', success, fail, complete } = options
    this._closeData = {
      code,
      reason
    }
    try {
      this._socket.close()
      const res = { errMsg: 'closeSocket:ok' }
      webHandleSuccess(res, success, complete)
      return Promise.resolve(res)
    } catch (err) {
      const res = { errMsg: `closeSocket:fail ${err}` }
      webHandleFail(res, fail, complete)
      if (!fail) {
        return Promise.reject(res)
      }
    }
  }

  addListener (socket) {
    socket.onOpen = event => { typeof this._openCb === 'function' && this._openCb(event) }
    socket.onmessage = event => { typeof this._messageCb === 'function' && this._messageCb(event) }
    socket.onerror = event => {
      socketTasks.delete(this._socket)
      typeof this._errorCb === 'function' && this._errorCb(event)
    }
    socket.onclose = event => {
      socketTasks.delete(this._socket)
      if (typeof this._closeCb !== 'function') {
        return
      }
      if (this._closeData) {
        this._closeCb(event)
      } else {
        this._closeCb({ code: 2000, reason: `${event}` })
      }
    }
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
