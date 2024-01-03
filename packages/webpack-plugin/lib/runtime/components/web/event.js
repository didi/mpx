import { extendEvent } from './getInnerListeners'
import { isBrowser } from '../../env'

function MpxEvent (layer) {
    this.targetElement = null

    this.touches = []

    this.touchStartX = 0

    this.touchStartY = 0

    this.startTimer = null

    this.needTap = true

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

    this.sendEvent = (targetElement, type, event) => {
        // eslint-disable-next-line no-undef
        const clickEvent = new TouchEvent(type, {
            view: window,
            bubbles: true,
            cancelable: true
        })
        const changedTouches = event.changedTouches
        extendEvent(clickEvent, {
            currentTarget: event.target,
            changedTouches,
            touches: this.touches,
            detail: {
                x: changedTouches[0].pageX,
                y: changedTouches[0].pageY
            }
        })
        targetElement && targetElement.dispatchEvent(clickEvent)
    }

    layer.addEventListener('touchstart', this.onTouchStart, false)
    layer.addEventListener('touchmove', this.onTouchMove, false)
    layer.addEventListener('touchend', this.onTouchEnd, false)
}
if (isBrowser) {
    document.addEventListener('DOMContentLoaded', () => {
      // eslint-disable-next-line no-new
      new MpxEvent(document.getElementsByTagName('body')[0])
    }, false)
}
