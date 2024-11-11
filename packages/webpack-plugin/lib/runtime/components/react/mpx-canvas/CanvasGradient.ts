import { ID, WEBVIEW_TARGET, registerWebviewTarget, registerWebviewConstructor, registerWebviewMethods } from './utils'

export default class CanvasGradient {
  private canvas: any;
  [WEBVIEW_TARGET]: string;

  constructor (canvas: any, noOnConstruction = false) {
    this.canvas = canvas
    this[WEBVIEW_TARGET] = ID()
    registerWebviewTarget(this, 'CanvasGradient')
    registerWebviewMethods(this, ['addColorStop'])
    if (!noOnConstruction) {
      this.onConstruction()
    }
  }

  postMessage (message: any) {
    return this.canvas.postMessage(message)
  }
}

// 注册构造器
registerWebviewConstructor(CanvasGradient, 'CanvasGradient')
