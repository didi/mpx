const mpxEvent = (layer, options) => {
    options = options || {}
    this.targetElement = null

    this.touchStartX = 0

    this.touchStartY = 0

    this.startTimer = null

    this.needTap = true

    this.onTouchStart = (event) => {
        if (event.targetTouches?.length > 1) {
            return true
        }

        const touch = event.targetTouches[0]
        this.targetElement = event.target
        this.needTap = true
        this.startTimer = null
        this.touchStartX = touch.pageX
        this.touchStartY = touch.pageY
        this.startTimer = setTimeout(() => {
            this.needTap = false
            this.sendEvent(this.targetElement, 'longpress')
            this.sendEvent(this.targetElement, 'longtap')
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

    this.onTouchEnd = () => {
        this.startTimer && clearTimeout(this.startTimer)
        this.startTimer = null
        if (this.needTap) {
            this.sendEvent(this.targetElement, 'tap')
        }
    }

    this.sendEvent = (targetElement, type) => {
        // eslint-disable-next-line no-undef
        const clickEvent = new TouchEvent(type, {
            view: window,
            bubbles: true,
            cancelable: true
        })
        targetElement && targetElement.dispatchEvent(clickEvent)
    }

    layer.addEventListener('touchstart', this.onTouchStart, false)
    layer.addEventListener('touchmove', this.onTouchMove, false)
    layer.addEventListener('touchend', this.onTouchEnd, false)
    layer.addEventListener('contextmenu', (e) => {
        e.preventDefault()
    })
}
if (typeof window !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        mpxEvent(document.getElementsByTagName('body')[0])
    }, false)
}
