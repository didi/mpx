import {
  registerWebviewConstructor
} from './utils'

export default class ImageData {
  constructor (canvas, dataArray, width, height, noOnConstruction) {
    this.canvas = canvas
    if (!noOnConstruction) {
      this.onConstruction(dataArray, width, height)
    }
  }

  postMessage = (message) => {
    return this.canvas.postMessage(message)
  };
}

export function createImageData (canvas, dataArray, width, height) {
  return new ImageData(canvas, dataArray, width, height)
}

// 注册构造器
registerWebviewConstructor(ImageData, 'ImageData')
