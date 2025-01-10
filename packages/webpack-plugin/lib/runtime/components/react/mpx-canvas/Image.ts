import { WebviewMessage, WEBVIEW_TARGET, registerWebviewProperties, CanvasInstance } from './utils'

const PROPERTIES = {
  crossOrigin: undefined,
  height: undefined,
  src: undefined,
  width: undefined
}

export class Image {
  [WEBVIEW_TARGET]: string;
  canvas: any;
  width: number;
  height: number;
  private _loadListener: any;
  private _errorListener: any;
  private _onload: ((...args: any[]) => void);
  private _onerror: ((...args: any[]) => void);
  [key: string]: any;

  constructor (canvas: CanvasInstance, width?: number, height?: number, noOnConstruction = false) {
    this.canvas = canvas
    registerWebviewProperties(this, PROPERTIES)

    if (width) {
      this.width = width
    }
    if (height) {
      this.height = height
    }

    if (this.onConstruction && !noOnConstruction) {
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

  postMessage (message: WebviewMessage) {
    return this.canvas.postMessage(message)
  }

  addEventListener (type: 'load' | 'error', callbackFn: Function) {
    return this.canvas.addMessageListener((message: WebviewMessage) => {
      const target = message?.payload?.target as { [key: string]: any } || {}
      if (
        message &&
        message.type === 'event' &&
        target[WEBVIEW_TARGET] === this[WEBVIEW_TARGET] &&
        message.payload.type === type
      ) {
        for (const key in target) {
          const value = target[key]
          if (key in this && this[key] !== value) {
            this[key] = value
          }
        }
        callbackFn({
          ...message.payload,
          target: this
        })
      }
    })
  }

  set onload (callback: ((...args: any[]) => void)) {
    this._onload = callback
    if (this._loadListener) {
      this.canvas.removeMessageListener(this._loadListener)
    }
    if (callback) {
      this._loadListener = this.addEventListener('load', callback)
    }
  }

  get onload (): ((...args: any[]) => void) {
    return this._onload
  }

  set onerror (callback: ((...args: any[]) => void)) {
    this._onerror = callback
    if (this._errorListener) {
      this.canvas.removeMessageListener(this._errorListener)
    }
    if (callback) {
      this._errorListener = this.addEventListener('error', callback)
    }
  }

  get onerror () : ((...args: any[]) => void) {
    return this._onerror
  }
}

export function createImage (canvas: CanvasInstance, width?: number, height?: number) {
  return new Image(canvas, width, height)
}
