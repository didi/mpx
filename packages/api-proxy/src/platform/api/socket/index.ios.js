import { successHandle, failHandle } from '../../../common/js'
import SocketTask from './SocketTask'

function connectSocket (options = { url: '' }) {
  const { url, protocols, header, success, fail, complete } = options

  try {
    const socketTask = new SocketTask(url, protocols, header)
    successHandle({ errMsg: 'connectSocket:ok' }, success, complete)
    return socketTask
  } catch (e) {
    failHandle({ errMsg: `connectSocket:fail ${e}` }, fail, complete)
  }
}

export {
  sendSocketMessage,
  closeSocket,
  onSocketOpen,
  onSocketError,
  onSocketMessage,
  onSocketClose
} from './index.web'

export {
  connectSocket
}
