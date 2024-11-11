import { WEBVIEW_TARGET, constructors, setupWebviewMethods, setupWebviewConstructor } from './utils'
const METHODS = ['addColorStop']
export default class CanvasGradient {
  private canvas: any;
  [WEBVIEW_TARGET]?: string;

  constructor (canvas: any) {
    this.canvas = canvas
    setupWebviewMethods(this, METHODS)
    setupWebviewConstructor(this, 'CanvasGradient')
  }
  postMessage = (message: any) => {
    return this.canvas.postMessage(message)
  }
}
