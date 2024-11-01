/**
 * @typedef {Object} Message
 * @property {string} id
 */

export default class Bus {
  _paused = false;
  _messageListeners = {};
  _queue = [];
  constructor (send) {
    this._send = send
  }

  post (message) {
    return new Promise((resolve) => {
      if (message.type !== "set") {
        this._messageListeners[message.id] = resolve;
      }

      if (!this._paused) {
        this._send(message);
      } else {
        this._queue.push(message);
      }
    })
  }

  handle (message) {
    const handler = this._messageListeners[message.id];
    delete this._messageListeners[message.id];

    if (handler) {
      handler(message);
    } else {
      console.warn("Received unexpected message", message);
    }
  }

  pause () {
    this._paused = true;
  }

  resume () {
    this._paused = false;
    this._send(this._queue);
    this._queue = [];
  }
}
