import { extendEvent } from './getInnerListeners'
import { isBrowser } from '../../env'
import { parseDataset } from '@mpxjs/utils'

function MpxEvent (layer) {
    this.targetElement = null

    this.touches = []

    this.touchStartX = 0

    this.touchStartY = 0

    this.startTimer = null

    this.needTap = true

    this.isTouchDevice = document && ('ontouchstart' in document.documentElement)

    this.onTouchStart = (event) => {
        if (event.targetTouches?.length > 1) {
            return true
        }

        this.touches = event.targetTouches
        this.targetElement = event.target
        this.needTap = true
        this.startTimer = null
        this.touchStartX = this.touches[0].pageX
        this.touchStartY = this.touches[0].pageY
        this.startTimer = setTimeout(() => {
            this.needTap = false
            this.sendEvent(this.targetElement, 'longpress', event)
            this.sendEvent(this.targetElement, 'longtap', event)
        }, 350)
    }

    this.onTouchMove = (event) => {
        const touch = event.changedTouches[0]
        if (Math.abs(touch.pageX - this.touchStartX) > 1 || Math.abs(touch.pageY - this.touchStartY) > 1) {
            this.needTap = false
            this.startTimer && clearTimeout(this.startTimer)
            this.startTimer = null
        }
    }

    this.onTouchEnd = (event) => {
        if (event.targetTouches?.length > 1) {
            return true
        }
        this.startTimer && clearTimeout(this.startTimer)
        this.startTimer = null
        if (this.needTap) {
            this.sendEvent(this.targetElement, 'tap', event)
        }
    }

    this.onClick = (event) => {
        this.targetElement = event.target
        this.sendEvent(this.targetElement, 'tap', event)
    }
    this.sendEvent = (targetElement, type, event) => {
        const touchEvent = new CustomEvent(type, {
            bubbles: true,
            cancelable: true
        })
        const changedTouches = event.changedTouches || []
           extendEvent(event.currentTarget, {
             dataset: parseDataset(event.currentTarget.dataset)
           })
           extendEvent(event.target, {
             dataset: parseDataset(event.target.dataset)
           })
        extendEvent(touchEvent, {
          timeStamp: event.timeStamp,
          changedTouches,
          touches: changedTouches,
          detail: {
            // pc端点击事件可能没有changedTouches，所以直接从 event 中取
            x: changedTouches[0]?.pageX || event.pageX || 0,
            y: changedTouches[0]?.pageY || event.pageY || 0
          }
        })
        targetElement && targetElement.dispatchEvent(touchEvent)
    }

    this.addListener = () => {
        if (this.isTouchDevice) {
            layer.addEventListener('touchstart', this.onTouchStart, true)
            layer.addEventListener('touchmove', this.onTouchMove, true)
            layer.addEventListener('touchend', this.onTouchEnd, true)
        } else {
            layer.addEventListener('click', this.onClick, true)
        }
    }
    this.addListener()
}

export function createEvent () {
    if (isBrowser && !global.__mpxCreatedEvent) {
        global.__mpxCreatedEvent = true
        if (document.readyState === 'complete' || document.readyState === 'interactive') {
            // eslint-disable-next-line no-new
            new MpxEvent(document.body)
        } else {
            document.addEventListener('DOMContentLoaded', function () {
                // eslint-disable-next-line no-new
                new MpxEvent(document.body)
            }, false)
        }
    }
}
