const socketTasks: Set<WebSocket> = new Set()

class SocketTask {
  _socket: WebSocket
  _closeData: WechatMiniprogram.SocketTaskOnCloseCallbackResult = null
  _openCb: Function = null
  _closeCb: Function = null
  _messageCb: Function = null
  _errorCb: Function = null
  constructor (url: string, protocols?: string[]) {
    if (protocols && protocols.length > 0) {
      this._socket = new WebSocket(url, protocols)
    } else {
      this._socket = new WebSocket(url)
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

  send (options: WechatMiniprogram.SocketTaskSendOption) {
    const { data = '', success, fail, complete } = options

    if (this._socket.readyState === 1) {
      this._socket.send(data)
      const res = { errMsg: 'sendSocketMessage:ok' }
      typeof success === 'function' && success(res)
      typeof complete === 'function' && complete(res)
    } else {
      const res = { errMsg: 'sendSocketMessage:fail' }
      typeof fail === 'function' && fail(res)
      typeof complete === 'function' && complete(res)
    }
  }

  close (options: WechatMiniprogram.CloseSocketOption) {
    const { code = 1000, reason = '', success, fail, complete } = options
    this._closeData = {
      code,
      reason
    }
    try {
      this._socket.close()
      const res = { errMsg: 'closeSocket:ok' }
      typeof success === 'function' && success(res)
      typeof complete === 'function' && complete(res)
    } catch (err) {
      const res = { errMsg: `closeSocket:fail ${err}` }
      typeof fail === 'function' && fail(res)
      typeof complete === 'function' && complete(res)
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

  onOpen (cb: any) {
    this._openCb = cb
  }

  onMessage (cb: any) {
    this._messageCb = cb
  }

  onError (cb: any) {
    this._errorCb = cb
  }

  onClose (cb: any) {
    this._closeCb = cb
  }
}

export default SocketTask
