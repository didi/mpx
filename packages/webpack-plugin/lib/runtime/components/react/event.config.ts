interface EventConfig {
  [key: string]: string[];
}

const eventConfigMap: EventConfig = {
  bindtap: ['onTouchEnd'],
  bindlongpress: ['onTouchStart', 'onTouchMove', 'onTouchEnd'],
  bindtouchstart: ['onTouchStart'],
  bindtouchmove: ['onTouchMove'],
  bindtouchend: ['onTouchEnd'],
  bindtouchcancel: ['onTouchCancel'],
  catchtap: ['onTouchEnd'],
  catchlongpress: ['onTouchStart', 'onTouchMove', 'onTouchEnd'],
  catchtouchstart: ['onTouchStart'],
  catchtouchmove: ['onTouchMove'],
  catchtouchend: ['onTouchEnd'],
  catchtouchcancel: ['onTouchCancel'],
  'capture-bindtap': ['onTouchStartCapture'],
  'capture-bindlongpress': ['onTouchStartCapture', 'onTouchMoveCapture', 'onTouchEndCapture'],
  'capture-bindtouchstart': ['onTouchStartCapture'],
  'capture-bindtouchmove': ['onTouchMoveCapture'],
  'capture-bindtouchend': ['onTouchEndCapture'],
  'capture-bindtouchcancel': ['onTouchCancelCapture'],
  'capture-catchtap': ['onTouchStartCapture'],
  'capture-catchlongpress': ['onTouchStartCapture', 'onTouchMoveCapture', 'onTouchEndCapture'],
  'capture-catchtouchstart': ['onTouchStartCapture'],
  'capture-catchtouchmove': ['onTouchMoveCapture'],
  'capture-catchtouchend': ['onTouchEndCapture'],
  'capture-catchtouchcancel': ['onTouchCancelCapture']
}

export default eventConfigMap
