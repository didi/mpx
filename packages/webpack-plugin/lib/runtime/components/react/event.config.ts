interface EventConfig {
  [key: string]: string[];
}

const eventConfigMap: { [key: string]: { bitFlag: string; events: string[] } } = {
  bindtap: { bitFlag: '0', events: ['onTouchStart', 'onTouchMove', 'onTouchEnd'] },
  bindlongpress: { bitFlag: '1', events: ['onTouchStart', 'onTouchMove', 'onTouchEnd', 'onTouchCancel'] },
  bindtouchstart: { bitFlag: '2', events: ['onTouchStart'] },
  bindtouchmove: { bitFlag: '3', events: ['onTouchMove'] },
  bindtouchend: { bitFlag: '4', events: ['onTouchEnd'] },
  bindtouchcancel: { bitFlag: '5', events: ['onTouchCancel'] },
  catchtap: { bitFlag: '6', events: ['onTouchStart', 'onTouchMove', 'onTouchEnd'] },
  catchlongpress: { bitFlag: '7', events: ['onTouchStart', 'onTouchMove', 'onTouchEnd', 'onTouchCancel'] },
  catchtouchstart: { bitFlag: '8', events: ['onTouchStart'] },
  catchtouchmove: { bitFlag: '9', events: ['onTouchMove'] },
  catchtouchend: { bitFlag: 'a', events: ['onTouchEnd'] },
  catchtouchcancel: { bitFlag: 'b', events: ['onTouchCancel'] },
  'capture-bindtap': { bitFlag: 'c', events: ['onTouchStartCapture', 'onTouchMoveCapture', 'onTouchEndCapture'] },
  'capture-bindlongpress': { bitFlag: 'd', events: ['onTouchStartCapture', 'onTouchMoveCapture', 'onTouchEndCapture', 'onTouchCancelCapture'] },
  'capture-bindtouchstart': { bitFlag: 'e', events: ['onTouchStartCapture'] },
  'capture-bindtouchmove': { bitFlag: 'f', events: ['onTouchMoveCapture'] },
  'capture-bindtouchend': { bitFlag: 'g', events: ['onTouchEndCapture'] },
  'capture-bindtouchcancel': { bitFlag: 'h', events: ['onTouchCancelCapture'] },
  'capture-catchtap': { bitFlag: 'i', events: ['onTouchStartCapture', 'onTouchMoveCapture', 'onTouchEndCapture'] },
  'capture-catchlongpress': { bitFlag: 'j', events: ['onTouchStartCapture', 'onTouchMoveCapture', 'onTouchEndCapture', 'onTouchCancelCapture'] },
  'capture-catchtouchstart': { bitFlag: 'k', events: ['onTouchStartCapture'] },
  'capture-catchtouchmove': { bitFlag: 'l', events: ['onTouchMoveCapture'] },
  'capture-catchtouchend': { bitFlag: 'm', events: ['onTouchEndCapture'] },
  'capture-catchtouchcancel': { bitFlag: 'n', events: ['onTouchCancelCapture'] }
}
export default eventConfigMap
