import { warn, webHandleSuccess, webHandleFail } from '../../../common/js'
import SocketTask from './SocketTask'

function connectSocket (options = { url: '' }) {
  const { url, protocols, success, fail, complete } = options

  try {
    const socketTask = new SocketTask(url, protocols)
    webHandleSuccess({ errMsg: 'connectSocket:ok' }, success, complete)
    return socketTask
  } catch (e) {
    webHandleFail({ errMsg: `connectSocket:fail ${e}` }, fail, complete)
  }
}

function sendSocketMessage () {
  warn('sendSocketMessage 请使用 socketTask.send')
}

function closeSocket () {
  warn('closeSocket 请使用 socketTask.close')
}

function onSocketOpen () {
  warn('onSocketOpen 请使用 socketTask.onOpen')
}

function onSocketError () {
  warn('onSocketError 请使用 socketTask.onError')
}

function onSocketMessage () {
  warn('onSocketMessage 请使用 socketTask.onMessage')
}

function onSocketClose () {
  warn('onSocketClose 请使用 socketTask.onClose')
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
