import { WebviewMessage, registerWebviewProperties, registerWebviewMethods, registerWebviewTarget } from './utils'

const PROPERTIES = {
  fillStyle: '#000',
  font: '10px sans-serif',
  globalAlpha: 1.0,
  globalCompositeOperation: 'source-over',
  lineCap: 'butt',
  lineDashOffset: 0.0,
  lineJoin: 'miter',
  lineWidth: 1.0,
  miterLimit: 10.0,
  shadowBlur: 0,
  shadowColor: 'rgba(0,0,0,0)',
  shadowOffsetX: 0,
  shadowOffsetY: 0,
  strokeStyle: '#000',
  textAlign: 'start',
  textBaseline: 'alphabetic'
}

const METHODS = [
  'arc',
  'arcTo',
  'beginPath',
  'bezierCurveTo',
  'clearRect',
  'clip',
  'closePath',
  'createImageData',
  'createLinearGradient',
  'createPattern',
  'createRadialGradient',
  'drawImage',
  'fill',
  'fillRect',
  'fillText',
  'getImageData',
  'getLineDash',
  'lineTo',
  'measureText',
  'moveTo',
  'putImageData',
  'quadraticCurveTo',
  'rect',
  'restore',
  'rotate',
  'save',
  'scale',
  'setLineDash',
  'setTransform',
  'stroke',
  'strokeRect',
  'strokeText',
  'transform',
  'translate'
]
export default class CanvasRenderingContext2D {
  canvas: Record<string, any>
  constructor (canvas: Record<string, any>) {
    this.canvas = canvas
    registerWebviewTarget(this, 'context2D')
    registerWebviewProperties(this, PROPERTIES)
    registerWebviewMethods(this, METHODS)
  }

  postMessage (message: WebviewMessage) {
    return this.canvas.postMessage(message)
  }
}
