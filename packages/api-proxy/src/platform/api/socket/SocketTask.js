import { successHandle, failHandle } from '../../../common/js'
import { type } from '@mpxjs/utils'

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
    return this._socket.CONNECTING || 0
  }

  get OPEN () {
    return this._socket.OPEN || 1
  }

  get CLOSING () {
    return this._socket.CLOSING || 2
  }

  get CLOSED () {
    return this._socket.CLOSED || 3
  }

  get readyState () {
    return this._socket.readyState
  }

  send (options = {}) {
    const { data = '', success, fail, complete } = options
    if (typeof data !== 'string' || type(data) !== 'ArrayBuffer') {
      const res = { errMsg: 'sendSocketMessage:fail Unsupported data type' }
      failHandle(res, fail, complete)
    } else if (this._socket.readyState === 1) {
      this._socket.send(data)
      const res = { errMsg: 'sendSocketMessage:ok' }
      successHandle(res, success, complete)
    } else {
      const res = { errMsg: 'sendSocketMessage:fail' }
      failHandle(res, fail, complete)
    }
  }

  close (options = {}) {
    const { code = 1000, reason = '', success, fail, complete } = options
    this._closeData = {
      code,
      reason
    }
    try {
      this._socket.close()
      const res = { errMsg: 'closeSocket:ok' }
      successHandle(res, success, complete)
    } catch (err) {
      const res = { errMsg: `closeSocket:fail ${err}` }
      failHandle(res, fail, complete)
    }
  }

  addListener (socket) {
    socket.onopen = event => {
      typeof this._openCb === 'function' && this._openCb(event)
    }
    socket.onmessage = event => {
      typeof this._messageCb === 'function' && this._messageCb({
        data: event.data
      })
    }
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
        this._closeCb({ code: event.code, reason: event.reason })
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
