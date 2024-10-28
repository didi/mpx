import { isArray, noop } from "@mpxjs/utils"
import throttle from 'lodash/throttle'
import { Dimensions } from 'react-native'
import { getFocusedNavigation } from '../../../common/js'

const WindowRefStr = 'window'

class RNIntersectionObserver {
  constructor (component, options, intersectionCtx) {
    this.component = component
    this.options = options
    this.thresholds = options.thresholds.sort((a,b ) => a-b) || [0]
    this.initialRatio = options.initialRatio || 0
    this.observeAll = options.observeAll || false

    // 组件上挂载对应的observers，用于在组件销毁的时候进行批量disconnect
    this.component._intersectionObservers = this.component.__intersectionObservers || []
    this.component._intersectionObservers.push(this)

    this.observerRef = null
    this.relativeRef = null
    this.margins = {top: 0, bottom: 0, left: 0, right: 0}
    this.callback = noop

    this.throttleMeasure = this.getThrottleMeasure(options.throttleTime || 100)

    // 记录上一次相交的比例
    this.previousIntersectionRatio = []

     // 添加实例添加到上下文中，滚动组件可以获取到上下文内的实例从而触发滚动
     if (intersectionCtx && Array.isArray(intersectionCtx) && !intersectionCtx.includes(this)) {
      intersectionCtx.push(this)
      this.intersectionCtx = intersectionCtx
    }
    
    return this
  }
  relativeTo (selector, margins) {
    const relativeRef = this.component.__selectRef(selector, 'node')
    if (relativeRef) {
      this.relativeRef = relativeRef
      this.margins = margins || this.margins
    }
    return this
  }
  relativeToViewport(margins) {
    this.relativeRef = WindowRefStr
    this.margins = margins || this.margins
    return this
  }
  observe (selector, callback) {
    if (this.observerRef) {
      console.error('"observe" call can be only called once in IntersectionObserver')
      return
    }
    let targetRef = null
    if (this.observeAll){
      targetRef = this.component.__selectRef(selector, 'node', true)
    } else {
      targetRef = this.component.__selectRef(selector, 'node')
    }
    if (!targetRef || targetRef.length === 0) {
      console.error('intersection observer target not found')
      return
    }
    this.observerRef = isArray(targetRef) ? targetRef : [targetRef]
    this.callback = callback
    this._measureTarget(true)
  }
  _getWindowRect() {
    if (this.windowRect) return this.windowRect
    const navigation = getFocusedNavigation()
    const screen =  Dimensions.get('screen')
    const windowRect = {
      top: navigation.isCustomHeader ? this.margins.top : navigation.headerHeight,
      left: this.margins.left,
      right: screen.width - this.margins.right,
      bottom: navigation.layout.height + navigation.headerHeight - this.margins.bottom
    }
    this.windowRect = windowRect
    return this.windowRect
  }
  _getReferenceRect(targetRef) {
    if (targetRef === WindowRefStr) {
      return Promise.resolve([this._getWindowRect()])
    } else {
      if (!isArray(targetRef)) targetRef = [targetRef]
      const targetPromiseQueue = []
      targetRef.forEach((targetRefItem) => {
        const target = targetRefItem.getNodeInstance().nodeRef.current
        if (!target) console.error('intersection observer target ref not found')
        if (target) targetPromiseQueue.push(new Promise((resolve) => {
          target.measureInWindow(
            (x, y, width, height) => {
              const boundingClientRect = {
                left: x,
                top: y,
                right: x + width,
                bottom: y + height,
                width: width,
                height: height
              };
              resolve(boundingClientRect)
            },
          );
        })) 
      })
      return Promise.all(targetPromiseQueue)
    }
  }
  // 计算相交区域
  _measureIntersection(targetRect, relativeRect) {
    function restrictValueInRange(start = 0, end = 0, value = 0) {
      return Math.min(Math.max(start, value), end);
    }

    const visibleRect = {
      left: restrictValueInRange(relativeRect.left, relativeRect.right, targetRect.left),
      top: restrictValueInRange(relativeRect.top, relativeRect.bottom, targetRect.top),
      right: restrictValueInRange(relativeRect.left, relativeRect.right, targetRect.right),
      bottom: restrictValueInRange(relativeRect.top, relativeRect.bottom, targetRect.bottom),
    }

    const targetArea =(targetRect.bottom - targetRect.top) * (targetRect.right - targetRect.left);
    const visibleArea = (visibleRect.bottom - visibleRect.top) * (visibleRect.right - visibleRect.left);
    
    return {
      intersectionRatio: targetArea ? visibleArea / targetArea : 0,
      intersectionRect: {
        top: visibleRect.top,
        bottom: relativeRect.bottom,
        left: visibleRect.left,
        right: relativeRect.right,
      }
    }
  }
  getThrottleMeasure(throttleTime) {
    return throttle(() => {
      this._measureTarget()
    }, throttleTime)
  }
  // 计算节点的rect信息
  _measureTarget(isInit = false) {
    Promise.all([
      this._getReferenceRect(this.observerRef),
      this._getReferenceRect(this.relativeRef)
    ]).then(([observeRects, relativeRects]) => {
      observeRects.forEach((observeRect, index) => {
        const { intersectionRatio, intersectionRect } = this._measureIntersection(observeRect, relativeRects[0])
        const isCallback = isInit ? intersectionRatio >= this.initialRatio : this._isInsected(intersectionRatio, this.previousIntersectionRatio[index])
        // 初次调用的
        if (isCallback) {
          this.callback({
            index: index,
            id: this.observerRef[index].getNodeInstance().props?.current?.id,
            dataset: this.observerRef[index].getNodeInstance().props?.current?.dataset || {},
            intersectionRatio: Math.round(intersectionRatio * 100) / 100, 
            intersectionRect, 
            boundingClientRect: observeRect,
            relativeRect: relativeRects[0],
            time: Date.now()
          })
        }
        this.previousIntersectionRatio[index] = intersectionRatio
      })
    }).catch((e) => {
      console.log('_measureTarget fail', e)
    })
  }

  // 如果上一个与当前这个处于同一个thresholds区间的话，则不用触发
  _isInsected = (intersectionRatio, previousIntersectionRatio) => {
    // console.log('nowintersectionRatio, previousIntersectionRatio', [intersectionRatio, previousIntersectionRatio])
    let nowIndex = -1
    let previousIndex = -1
    this.thresholds.forEach((item, index) => {
      if (intersectionRatio >= item) {
        nowIndex = index
      }
      if (previousIntersectionRatio >= item) {
        previousIndex = index
      }
    })
    return !(nowIndex === previousIndex)
  }
  disconnect () {
    if (this.intersectionCtx && this.intersectionCtx.includes(this)) {
      this.intersectionCtx.splice(this.intersectionCtx.indexOf(this, 1))
    }
  }
}

export default RNIntersectionObserver
