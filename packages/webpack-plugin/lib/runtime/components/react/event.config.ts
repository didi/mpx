interface EventConfig {
  [key: string]: string[];
}

const eventConfigMap: { [key: string]: { bitFlag: string; events: string[] } } = {
  bindtap: { bitFlag: '000001', events: ['onTouchStart', 'onTouchMove', 'onTouchEnd'] },
  bindlongpress: { bitFlag: '000010', events: ['onTouchStart', 'onTouchMove', 'onTouchEnd', 'onTouchCancel'] },
  bindtouchstart: { bitFlag: '000011', events: ['onTouchStart'] },
  bindtouchmove: { bitFlag: '000100', events: ['onTouchMove'] },
  bindtouchend: { bitFlag: '000101', events: ['onTouchEnd'] },
  bindtouchcancel: { bitFlag: '000110', events: ['onTouchCancel'] },
  catchtap: { bitFlag: '000111', events: ['onTouchStart', 'onTouchMove', 'onTouchEnd'] },
  catchlongpress: { bitFlag: '001000', events: ['onTouchStart', 'onTouchMove', 'onTouchEnd', 'onTouchCancel'] },
  catchtouchstart: { bitFlag: '001001', events: ['onTouchStart'] },
  catchtouchmove: { bitFlag: '001010', events: ['onTouchMove'] },
  catchtouchend: { bitFlag: '001011', events: ['onTouchEnd'] },
  catchtouchcancel: { bitFlag: '001100', events: ['onTouchCancel'] },
  'capture-bindtap': { bitFlag: '001101', events: ['onTouchStartCapture', 'onTouchMoveCapture', 'onTouchEndCapture'] },
  'capture-bindlongpress': { bitFlag: '001110', events: ['onTouchStartCapture', 'onTouchMoveCapture', 'onTouchEndCapture', 'onTouchCancelCapture'] },
  'capture-bindtouchstart': { bitFlag: '001111', events: ['onTouchStartCapture'] },
  'capture-bindtouchmove': { bitFlag: '010000', events: ['onTouchMoveCapture'] },
  'capture-bindtouchend': { bitFlag: '010001', events: ['onTouchEndCapture'] },
  'capture-bindtouchcancel': { bitFlag: '010010', events: ['onTouchCancelCapture'] },
  'capture-catchtap': { bitFlag: '010011', events: ['onTouchStartCapture', 'onTouchMoveCapture', 'onTouchEndCapture'] },
  'capture-catchlongpress': { bitFlag: '010100', events: ['onTouchStartCapture', 'onTouchMoveCapture', 'onTouchEndCapture', 'onTouchCancelCapture'] },
  'capture-catchtouchstart': { bitFlag: '010101', events: ['onTouchStartCapture'] },
  'capture-catchtouchmove': { bitFlag: '010110', events: ['onTouchMoveCapture'] },
  'capture-catchtouchend': { bitFlag: '010111', events: ['onTouchEndCapture'] },
  'capture-catchtouchcancel': { bitFlag: '011000', events: ['onTouchCancelCapture'] }
}
export default eventConfigMap
