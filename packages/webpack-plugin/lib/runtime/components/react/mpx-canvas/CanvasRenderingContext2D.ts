import { CanvasInstance, WebviewMessage, registerWebviewProperties, registerWebviewMethods, registerWebviewTarget } from './utils'

const PROPERTIES = {
  direction: 'inherit',
  fillStyle: '#000',
  filter: 'none',
  font: '10px sans-serif',
  fontKerning: 'auto',
  fontStretch: 'auto',
  fontVariantCaps: 'normal',
  globalAlpha: 1.0,
  globalCompositeOperation: 'source-over',
  imageSmoothingEnabled: 'true',
  imageSmoothingQuality: 'low',
  letterSpacing: '0px',
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
  textBaseline: 'alphabetic',
  textRendering: 'auto',
  wordSpacing: '0px'
}

const METHODS = [
  'arc',
  'arcTo',
  'beginPath',
  'bezierCurveTo',
  'clearRect',
  'clip',
  'closePath',
  'createConicGradient',
  'createImageData',
  'createLinearGradient',
  'createPattern',
  'createRadialGradient',
  'drawFocusIfNeeded',
  'drawImage',
  'ellipse',
  'fill',
  'fillRect',
  'fillText',
  'getImageData',
  'getLineDash',
  'getTransform',
  'lineTo',
  'measureText',
  'moveTo',
  'putImageData',
  'quadraticCurveTo',
  'rect',
  'reset',
  'resetTransform',
  'restore',
  'rotate',
  'roundRect',
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
  canvas: CanvasInstance
  constructor (canvas: CanvasInstance) {
    this.canvas = canvas
    registerWebviewTarget(this, 'context2D')
    registerWebviewProperties(this, PROPERTIES)
    registerWebviewMethods(this, METHODS)
  }

  postMessage (message: WebviewMessage) {
    return this.canvas.postMessage(message)
  }
}
