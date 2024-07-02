interface EventConfig {
  [key: string]: string[];
}

const eventConfigMap: EventConfig = {
  bindtap: ['onTouchStart', 'onTouchMove', 'onTouchEnd'],
  bindlongpress: ['onTouchStart', 'onTouchMove', 'onTouchEnd', 'onTouchCancel'],
  bindtouchstart: ['onTouchStart'],
  bindtouchmove: ['onTouchMove'],
  bindtouchend: ['onTouchEnd'],
  bindtouchcancel: ['onTouchCancel'],
  catchtap: ['onTouchStart', 'onTouchMove', 'onTouchEnd'],
  catchlongpress: ['onTouchStart', 'onTouchMove', 'onTouchEnd', 'onTouchCancel'],
  catchtouchstart: ['onTouchStart'],
  catchtouchmove: ['onTouchMove'],
  catchtouchend: ['onTouchEnd'],
  catchtouchcancel: ['onTouchCancel'],
  'capture-bindtap': ['onTouchStartCapture', 'onTouchMoveCapture', 'onTouchEndCapture'],
  'capture-bindlongpress': ['onTouchStartCapture', 'onTouchMoveCapture', 'onTouchEndCapture', 'onTouchCancelCapture'],
  'capture-bindtouchstart': ['onTouchStartCapture'],
  'capture-bindtouchmove': ['onTouchMoveCapture'],
  'capture-bindtouchend': ['onTouchEndCapture'],
  'capture-bindtouchcancel': ['onTouchCancelCapture'],
  'capture-catchtap': ['onTouchStartCapture', 'onTouchMoveCapture', 'onTouchEndCapture'],
  'capture-catchlongpress': ['onTouchStartCapture', 'onTouchMoveCapture', 'onTouchEndCapture', 'onTouchCancelCapture'],
  'capture-catchtouchstart': ['onTouchStartCapture'],
  'capture-catchtouchmove': ['onTouchMoveCapture'],
  'capture-catchtouchend': ['onTouchEndCapture'],
  'capture-catchtouchcancel': ['onTouchCancelCapture']
}

export default eventConfigMap
