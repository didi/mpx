import { CanvasInstance, registerWebviewConstructor, registerWebviewMethods } from './utils'

const METHODS = ['addColorStop']
export default class CanvasGradient {
  private canvas: CanvasInstance;

  constructor (canvas: CanvasInstance, noOnConstruction = false) {
    this.canvas = canvas
    registerWebviewMethods(this, METHODS)
    if (this.onConstruction && !noOnConstruction) {
      this.onConstruction()
    }
  }

  postMessage (message: any) {
    return this.canvas.postMessage(message)
  }
}

// 注册构造器, 需要通过 createLinearGradient 调用
registerWebviewConstructor(CanvasGradient, 'CanvasGradient')
