import { warn } from '@mpxjs/utils'
interface Message {
  id?: string
  type: string
  payload?: any
}
export default class Bus {
  _paused: Boolean = false;
  _messageListeners: { [key: string]: (message: Message) => void } = {}
  _queue: Message[] = []
  _send: (message: Message | Message[]) => void
  _timeoutId: NodeJS.Timeout | null = null; // 用于存储定时器 ID
  constructor (send: (message: Message | Message[]) => void) {
    this._send = send
  }

  post (message: Message): Promise<any> {
    return new Promise((resolve) => {
      if (message.type !== 'set' && message.id) {
        this._messageListeners[message.id] = resolve
      }

      if (!this._paused) {
        this._queue.push(message)
        this.startBatching()
      } else {
        this._queue.push(message)
      }
    })
  }

  handle (message: Message): void {
    if (!message.id) return
    const handler = this._messageListeners[message.id]
    delete this._messageListeners[message.id]

    if (handler) {
      handler(message)
    } else {
      warn(`Received unexpected message: ${message}`)
    }
  }

  pause (): void {
    this._paused = true
  }

  resume (): void {
    this._paused = false
    this._send(this._queue)
    this._queue = []
  }

  startBatching (): void {
    if (this._timeoutId) return

    this._timeoutId = setTimeout(() => {
      this._send(this._queue)
      this._queue = []
      this._timeoutId = null
    }, 10)
  }
}
