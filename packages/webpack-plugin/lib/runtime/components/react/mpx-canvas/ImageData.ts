import {
  WebviewMessage,
  CanvasInstance
} from './utils'

export default class ImageData {
  canvas: CanvasInstance;
  [key: string]: any;
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
