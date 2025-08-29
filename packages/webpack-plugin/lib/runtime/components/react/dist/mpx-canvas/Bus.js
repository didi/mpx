import { warn } from '@mpxjs/utils';
export default class Bus {
    _paused = false;
    _messageListeners = {};
    _queue = [];
    _send;
    _timeoutId = null;
    constructor(send) {
        this._send = send;
    }
    post(message) {
        return new Promise((resolve) => {
            if (message.type !== 'set' && message.id) {
                this._messageListeners[message.id] = resolve;
            }
            if (!this._paused) {
                this._queue.push(message);
                this.startBatching();
            }
            else {
                this._queue.push(message);
            }
        });
    }
    handle(message) {
        if (!message.id)
            return;
        const handler = this._messageListeners[message.id];
        delete this._messageListeners[message.id];
        if (handler) {
            handler(message);
        }
        else {
            warn(`Received unexpected message: ${message}`);
        }
    }
    pause() {
        this._paused = true;
    }
    resume() {
        this._paused = false;
        this._send(this._queue);
        this._queue = [];
    }
    startBatching() {
        if (this._timeoutId)
            return;
        this._timeoutId = setTimeout(() => {
            this._send(this._queue);
            this._queue = [];
            this._timeoutId = null;
        }, 16);
    }
    clearBatchingTimeout() {
        if (this._timeoutId) {
            clearTimeout(this._timeoutId);
            this._timeoutId = null;
        }
    }
}
