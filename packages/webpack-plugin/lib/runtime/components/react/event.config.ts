import type { EventMeta } from './types/getInnerListeners'

const tapEvents = ['onTouchStart', 'onTouchMove', 'onTouchEnd']
const longpressEvents = ['onTouchStart', 'onTouchMove', 'onTouchEnd', 'onTouchCancel']
const tapCaptureEvents = ['onTouchStartCapture', 'onTouchMoveCapture', 'onTouchEndCapture']
const longpressCaptureEvents = ['onTouchStartCapture', 'onTouchMoveCapture', 'onTouchEndCapture', 'onTouchCancelCapture']

const eventConfigMap: Record<string, EventMeta> = {
  bindtap: { bitFlag: '0', events: tapEvents, eventName: 'tap', eventType: 'bubble', hasCatch: false },
  bindlongpress: { bitFlag: '1', events: longpressEvents, eventName: 'longpress', eventType: 'bubble', hasCatch: false },
  bindtouchstart: { bitFlag: '2', events: ['onTouchStart'], eventName: 'touchstart', eventType: 'bubble', hasCatch: false },
  bindtouchmove: { bitFlag: '3', events: ['onTouchMove'], eventName: 'touchmove', eventType: 'bubble', hasCatch: false },
  bindtouchend: { bitFlag: '4', events: ['onTouchEnd'], eventName: 'touchend', eventType: 'bubble', hasCatch: false },
  bindtouchcancel: { bitFlag: '5', events: ['onTouchCancel'], eventName: 'touchcancel', eventType: 'bubble', hasCatch: false },
  catchtap: { bitFlag: '6', events: tapEvents, eventName: 'tap', eventType: 'bubble', hasCatch: true },
  catchlongpress: { bitFlag: '7', events: longpressEvents, eventName: 'longpress', eventType: 'bubble', hasCatch: true },
  catchtouchstart: { bitFlag: '8', events: ['onTouchStart'], eventName: 'touchstart', eventType: 'bubble', hasCatch: true },
  catchtouchmove: { bitFlag: '9', events: ['onTouchMove'], eventName: 'touchmove', eventType: 'bubble', hasCatch: true },
  catchtouchend: { bitFlag: 'a', events: ['onTouchEnd'], eventName: 'touchend', eventType: 'bubble', hasCatch: true },
  catchtouchcancel: { bitFlag: 'b', events: ['onTouchCancel'], eventName: 'touchcancel', eventType: 'bubble', hasCatch: true },
  'capture-bindtap': { bitFlag: 'c', events: tapCaptureEvents, eventName: 'tap', eventType: 'capture', hasCatch: false },
  'capture-bindlongpress': { bitFlag: 'd', events: longpressCaptureEvents, eventName: 'longpress', eventType: 'capture', hasCatch: false },
  'capture-bindtouchstart': { bitFlag: 'e', events: ['onTouchStartCapture'], eventName: 'touchstart', eventType: 'capture', hasCatch: false },
  'capture-bindtouchmove': { bitFlag: 'f', events: ['onTouchMoveCapture'], eventName: 'touchmove', eventType: 'capture', hasCatch: false },
  'capture-bindtouchend': { bitFlag: 'g', events: ['onTouchEndCapture'], eventName: 'touchend', eventType: 'capture', hasCatch: false },
  'capture-bindtouchcancel': { bitFlag: 'h', events: ['onTouchCancelCapture'], eventName: 'touchcancel', eventType: 'capture', hasCatch: false },
  'capture-catchtap': { bitFlag: 'i', events: tapCaptureEvents, eventName: 'tap', eventType: 'capture', hasCatch: true },
  'capture-catchlongpress': { bitFlag: 'j', events: longpressCaptureEvents, eventName: 'longpress', eventType: 'capture', hasCatch: true },
  'capture-catchtouchstart': { bitFlag: 'k', events: ['onTouchStartCapture'], eventName: 'touchstart', eventType: 'capture', hasCatch: true },
  'capture-catchtouchmove': { bitFlag: 'l', events: ['onTouchMoveCapture'], eventName: 'touchmove', eventType: 'capture', hasCatch: true },
  'capture-catchtouchend': { bitFlag: 'm', events: ['onTouchEndCapture'], eventName: 'touchend', eventType: 'capture', hasCatch: true },
  'capture-catchtouchcancel': { bitFlag: 'n', events: ['onTouchCancelCapture'], eventName: 'touchcancel', eventType: 'capture', hasCatch: true }
}

export default eventConfigMap
