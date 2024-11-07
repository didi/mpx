import { WEBVIEW_TARGET, constructors } from './utils'

export default class CanvasGradient {
  private canvas: any;
  [WEBVIEW_TARGET]?: string;

  constructor (canvas: any) {
    this.canvas = canvas
  }
  postMessage = (message: any) => {
    return this.canvas.postMessage(message)
  }
  toJSON () {
    return { __ref__: this[WEBVIEW_TARGET] };
  }
  addColorStop (offset: number, color: string) {
    return this.postMessage({
      type: 'exec',
      payload: {
        target: this[WEBVIEW_TARGET],
        method: 'addColorStop',
        args: [offset, color]
      }
    })
  }

  // 添加静态方法用于本地构造实例
  static constructLocally (canvas: any, ...args: any[]) {
    return new CanvasGradient(canvas, ...args, true)
  }
}
constructors.CanvasGradient = CanvasGradient