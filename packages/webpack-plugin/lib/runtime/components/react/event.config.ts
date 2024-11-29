import { NativeTouchEvent } from './types/getInnerListeners'
interface EventConfig {
  [key: string]: string[];
}

export const eventConfigMap: EventConfig = {
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

export const createTouchEventList = (
  handleTouchstart: (e: NativeTouchEvent, type: 'bubble' | 'capture') => void,
  handleTouchmove: (e: NativeTouchEvent, type: 'bubble' | 'capture') => void,
  handleTouchend: (e: NativeTouchEvent, type: 'bubble' | 'capture') => void,
  handleTouchcancel:(e: NativeTouchEvent, type: 'bubble' | 'capture') => void
) => [{
  eventName: 'onTouchStart',
  handler: (e: NativeTouchEvent) => {
    handleTouchstart(e, 'bubble')
  }
}, {
  eventName: 'onTouchMove',
  handler: (e: NativeTouchEvent) => {
    handleTouchmove(e, 'bubble')
  }
}, {
  eventName: 'onTouchEnd',
  handler: (e: NativeTouchEvent) => {
    handleTouchend(e, 'bubble')
  }
}, {
  eventName: 'onTouchCancel',
  handler: (e: NativeTouchEvent) => {
    handleTouchcancel(e, 'bubble')
  }
}, {
  eventName: 'onTouchStartCapture',
  handler: (e: NativeTouchEvent) => {
    handleTouchstart(e, 'capture')
  }
}, {
  eventName: 'onTouchMoveCapture',
  handler: (e: NativeTouchEvent) => {
    handleTouchmove(e, 'capture')
  }
}, {
  eventName: 'onTouchEndCapture',
  handler: (e: NativeTouchEvent) => {
    handleTouchend(e, 'capture')
  }
}, {
  eventName: 'onTouchCancelCapture',
  handler: (e: NativeTouchEvent) => {
    handleTouchcancel(e, 'capture')
  }
}]
