export default class ImageData {
    canvas;
    constructor(canvas, dataArray, width, height, noOnConstruction) {
        this.canvas = canvas;
        if (this.onConstruction && !noOnConstruction) {
            this.onConstruction(dataArray, width, height);
        }
    }
    postMessage = (message) => {
        return this.canvas.postMessage(message);
    };
}
export function createImageData(canvas, dataArray, width, height) {
    return new ImageData(canvas, dataArray, width, height);
}
