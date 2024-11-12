import { ID, WEBVIEW_TARGET, registerWebviewConstructor, registerWebviewMethods } from './utils'

const METHODS = ['addColorStop']
export default class CanvasGradient {
  private canvas: any;
  [WEBVIEW_TARGET]: string;

  constructor (canvas: any, noOnConstruction = false) {
    this.canvas = canvas
    this[WEBVIEW_TARGET] = ID()
    registerWebviewMethods(this, METHODS)
    if (!noOnConstruction) {
      this.onConstruction()
    }
  }

  postMessage (message: any) {
    return this.canvas.postMessage(message)
  }
}

// 注册构造器, 需要通过 createLinearGradient 调用
registerWebviewConstructor(CanvasGradient, 'CanvasGradient')
