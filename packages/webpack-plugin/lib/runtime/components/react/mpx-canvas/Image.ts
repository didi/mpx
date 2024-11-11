import { WEBVIEW_TARGET, constructors, ID, setupWebviewProperties } from './utils'
import { warn } from '@mpxjs/utils'

export class Image {
  canvas: any;
  width: Number;
  height: Number;
  constructor (canvas: any, width: Number, height: Number, noOnConstruction?: Boolean) {
    if (!(canvas instanceof Canvas)) {
      warn('Image must be initialized with a Canvas instance')
    }
    this.canvas = canvas
    if (width) {
      this.width = width
    }
    if (height) {
      this.height = height
    }
    if (!noOnConstruction) {
      this.onConstruction()
    }
    setupWebviewProperties(this, {
      crossOrigin: undefined,
      height: undefined,
      src: undefined,
      width: undefined
    })
  }

  postMessage = (message: any) => {
    return this.canvas.postMessage(message)
  }

  // 添加静态方法用于本地构造实例
  static constructLocally (canvas: any, ...args: any[]) {
    return new Image(canvas, ...args, true)
  }

  onConstruction (...args) {
    this[WEBVIEW_TARGET] = ID()
    this.postMessage({
      type: 'construct',
      payload: {
        constructor: 'Image',
        id: this[WEBVIEW_TARGET],
        args
      }
    })
  }

  toJSON () {
    return { __ref__: this[WEBVIEW_TARGET] }
  }
}

export function createImage (canvas, height, width) {
  return new Image(canvas, height, width)
}
constructors.Image = Image
