import {
  WebviewMessage,
  registerWebviewConstructor,
  CanvasInstance
} from './utils'

export default class ImageData {
  canvas: CanvasInstance;
  constructor (canvas: CanvasInstance, dataArray: number[], width: number, height: number, noOnConstruction?: boolean) {
    this.canvas = canvas
    if (this.onConstruction && !noOnConstruction) {
      this.onConstruction(dataArray, width, height)
    }
  }

  postMessage = (message: WebviewMessage) => {
    return this.canvas.postMessage(message)
  };
}

export function createImageData (canvas: CanvasInstance, dataArray: number[], width: number, height: number) {
  return new ImageData(canvas, dataArray, width, height)
}

// 注册构造器
registerWebviewConstructor(ImageData, 'ImageData')
