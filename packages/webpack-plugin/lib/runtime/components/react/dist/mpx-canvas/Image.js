import { WEBVIEW_TARGET, registerWebviewProperties } from './utils';
import { extendObject } from '../utils';
const PROPERTIES = {
    crossOrigin: undefined,
    height: undefined,
    src: undefined,
    width: undefined
};
export class Image {
    [WEBVIEW_TARGET];
    canvas;
    width;
    height;
    _loadListener;
    _errorListener;
    _onload;
    _onerror;
    constructor(canvas, width, height, noOnConstruction = false) {
        this.canvas = canvas;
        registerWebviewProperties(this, PROPERTIES);
        if (width) {
            this.width = width;
        }
        if (height) {
            this.height = height;
        }
        if (this.onConstruction && !noOnConstruction) {
            this.onConstruction();
            this.postMessage({
                type: 'listen',
                payload: {
                    types: ['error', 'load'],
                    target: this[WEBVIEW_TARGET]
                }
            });
        }
    }
    postMessage(message) {
        return this.canvas.postMessage(message);
    }
    addEventListener(type, callbackFn) {
        return this.canvas.addMessageListener((message) => {
            const target = message?.payload?.target || {};
            if (message &&
                message.type === 'event' &&
                target[WEBVIEW_TARGET] === this[WEBVIEW_TARGET] &&
                message.payload.type === type) {
                for (const key in target) {
                    const value = target[key];
                    if (key in this && this[key] !== value) {
                        this[key] = value;
                    }
                }
                callbackFn(extendObject({}, message.payload, { target: this }));
            }
        });
    }
    set onload(callback) {
        this._onload = callback;
        if (this._loadListener) {
            this.canvas.removeMessageListener(this._loadListener);
        }
        if (callback) {
            this._loadListener = this.addEventListener('load', callback);
        }
    }
    get onload() {
        return this._onload;
    }
    set onerror(callback) {
        this._onerror = callback;
        if (this._errorListener) {
            this.canvas.removeMessageListener(this._errorListener);
        }
        if (callback) {
            this._errorListener = this.addEventListener('error', callback);
        }
    }
    get onerror() {
        return this._onerror;
    }
}
export function createImage(canvas, width, height) {
    return new Image(canvas, width, height);
}
