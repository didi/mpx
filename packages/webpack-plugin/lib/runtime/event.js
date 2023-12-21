const mpxEvents = (layer, options) => {
    options = options || {}

    this.targetElement = null

    this.touchStartX = 0

    this.touchStartY = 0

    this.startTimer = null

    this.touchBoundary = options.touchBoundary || 10

    this.sendEvent = (targetElement, type) => {
        if (document.activeElement && document.activeElement !== targetElement) {
            document.activeElement.blur()
        }
        const clickEvent = new TouchEvent(type, {
            view: window,
            bubbles: true,
            cancelable: true
        })
        targetElement.dispatchEvent(clickEvent)
    }

    this.onTouchStart = (event) => {
        if (event.targetTouches?.length > 1) {
            return true
        }

        const touch = event.targetTouches[0]
        this.targetElement = event.target

        this.touchStartX = touch.pageX
        this.touchStartY = touch.pageY
        this.startTimer = setTimeout(() => {
            this.sendEvent(this.targetElement, 'longpress')
            this.sendEvent(this.targetElement, 'longtap')
        }, 350)
        return true
    }

    this.touchHasMoved = (event) => {
        const touch = event.changedTouches[0]
        const boundary = this.touchBoundary
        if (Math.abs(touch.pageX - this.touchStartX) > boundary || Math.abs(touch.pageY - this.touchStartY) > boundary) {
            this.startTimer && clearTimeout(this.startTimer)
            this.startTimer = null
            return true
        }
        return false
    }

    this.onTouchMove = (event) => {
        if (this.targetElement !== event.target || this.touchHasMoved(event)) {
            this.targetElement = null
        }
        return true
    }

    this.onTouchEnd = (event) => {
        const targetElement = this.targetElement
        this.startTimer && clearTimeout(this.startTimer)
        this.startTimer = null
        event.preventDefault()
        this.sendEvent(targetElement, 'tap')
        return false
    }

    layer.addEventListener('touchstart', this.onTouchStart, false)
    layer.addEventListener('touchmove', this.onTouchMove, false)
    layer.addEventListener('touchend', this.onTouchEnd, false)
    layer.addEventListener('contextmenu', (e) => {
        e.preventDefault()
    })
}

document.addEventListener('DOMContentLoaded', () => {
    mpxEvents(document.getElementsByTagName('body')[0])
}, false)
