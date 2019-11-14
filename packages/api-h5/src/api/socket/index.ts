import SocketTask from './SocketTask'

let SocketTasks = []

function connectSocket (options: WechatMiniprogram.ConnectSocketOption) {
  const { url, protocols, success, fail, complete } = options
  
  try {
    const socketTask = new SocketTask(url, protocols)
    SocketTasks.push(socketTask)

    const res = { errMsg: 'connectSocket:ok' }
    typeof success === 'function' && success(res)
    typeof complete === 'function' && complete(res)
  } catch (e) {
    const res = { errMsg: `connectSocket:fail ${e}` }
    typeof fail === 'function' && fail(res)
    typeof complete === 'function' && complete(res)
  }
}

function sendSocketMessage () {
  console.warn('sendSocketMessage 请使用 socketTask.send')
}

function closeSocket () {
  console.warn('closeSocket 请使用 socketTask.close')
}

function onSocketOpen () {
  console.warn('onSocketOpen 请使用 socketTask.onOpen')
}

function onSocketError () {
  console.warn('onSocketError 请使用 socketTask.onError')
}

function onSocketMessage () {
  console.warn('onSocketMessage 请使用 socketTask.onMessage')
}

function onSocketClose () {
  console.warn('onSocketClose 请使用 socketTask.onClose')
}

export {
  connectSocket,
  sendSocketMessage,
  closeSocket,
  onSocketOpen,
  onSocketError,
  onSocketMessage,
  onSocketClose
}
