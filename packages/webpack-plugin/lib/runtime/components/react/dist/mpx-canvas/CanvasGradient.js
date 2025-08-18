import { registerWebviewMethods } from './utils';
const METHODS = ['addColorStop'];
export default class CanvasGradient {
    canvas;
    constructor(canvas, noOnConstruction = false) {
        this.canvas = canvas;
        registerWebviewMethods(this, METHODS);
        if (this.onConstruction && !noOnConstruction) {
            this.onConstruction();
        }
    }
    postMessage(message) {
        return this.canvas.postMessage(message);
    }
}
