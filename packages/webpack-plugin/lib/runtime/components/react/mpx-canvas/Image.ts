import { WEBVIEW_TARGET, registerWebviewProperties, registerWebviewConstructor } from './utils'

const PROPERTIES = {
  crossOrigin: undefined,
  height: undefined,
  src: undefined,
  width: undefined
}

export class Image {
  canvas: any;
  width: number;
  height: number;
  private _loadListener: any;
  private _errorListener: any;
  private __onload: Function | undefined;
  private _onerror: Function | undefined;

  constructor (canvas: any, width?: number, height?: number, noOnConstruction = false) {
    this.canvas = canvas
    registerWebviewProperties(this, PROPERTIES)

    if (width) {
      this.width = width
    }
    if (height) {
      this.height = height
    }

    if (!noOnConstruction) {
      this.onConstruction()
      this.postMessage({
        type: 'listen',
        payload: {
          types: ['error', 'load'],
          target: this[WEBVIEW_TARGET]
        }
      })
    }
  }

  postMessage (message: any) {
    return this.canvas.postMessage(message)
  }

  addEventListener (type, callback) {
    return this.canvas.addMessageListener((message) => {
      if (
        message &&
        message.type === 'event' &&
        message.payload.target[WEBVIEW_TARGET] === this[WEBVIEW_TARGET] &&
        message.payload.type === type
      ) {
        for (const key in message.payload.target) {
          const value = message.payload.target[key]
          if (key in this && this[key] !== value) {
            this[key] = value
          }
        }
        callback({
          ...message.payload,
          target: this
        })
      }
    })
  }

  set onload (callback: Function | undefined) {
    this.__onload = callback
    if (this._loadListener) {
      this.canvas.removeMessageListener(this._loadListener)
    }
    if (callback) {
      this._loadListener = this.addEventListener('load', callback)
    }
  }

  get onload (): Function | undefined {
    return this._onload
  }

  set onerror (callback: Function | undefined) {
    this._onerror = callback
    if (this._errorListener) {
      this.canvas.removeMessageListener(this._errorListener)
    }
    if (callback) {
      this._errorListener = this.addEventListener('error', callback)
    }
  }

  get onerror (): Function | undefined {
    return this._onerror
  }
}

export function createImage (canvas, width, height) {
  return new Image(canvas, width, height)
}

// 注册构造器
registerWebviewConstructor(Image, 'Image')
