import { registerWebviewProperties, registerWebviewConstructor } from './utils'

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
    }
  }

  postMessage (message: any) {
    return this.canvas.postMessage(message)
  }
}

export function createImage (canvas, width, height) {
  return new Image(canvas, width, height)
}

// 注册构造器
registerWebviewConstructor(Image, 'Image')
