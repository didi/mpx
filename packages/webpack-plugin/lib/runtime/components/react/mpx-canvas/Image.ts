import { registerWebviewProperties, registerWebviewConstructor } from './utils'

const PROPERTIES = {
  crossOrigin: undefined,
  height: undefined,
  src: undefined,
  width: undefined
}

export class Image {
  canvas: any;
  width: Number;
  height: Number;
  constructor (canvas: any, width: Number, height: Number, noOnConstruction?: Boolean) {
    registerWebviewProperties(this, PROPERTIES)
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
  }

  postMessage = (message: any) => {
    return this.canvas.postMessage(message)
  }
}

export function createImage (canvas, height, width) {
  return new Image(canvas, height, width)
}

// 注册构造器
registerWebviewConstructor(Image, 'Image')
