import { WebviewMessage, CanvasInstance, registerWebviewMethods } from './utils'

const METHODS = ['addColorStop']
export default class CanvasGradient {
  private canvas: CanvasInstance;
  [key: string]: any;
  constructor (canvas: CanvasInstance, noOnConstruction = false) {
    this.canvas = canvas
    registerWebviewMethods(this, METHODS)
    if (this.onConstruction && !noOnConstruction) {
      this.onConstruction()
    }
  }

  postMessage (message: WebviewMessage) {
    return this.canvas.postMessage(message)
  }
}
