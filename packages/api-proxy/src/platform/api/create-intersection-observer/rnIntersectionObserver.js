import { isArray, noop } from "@mpxjs/utils"
import throttle from 'lodash/throttle'
import {
  Dimensions
} from 'react-native';

class RNIntersectionObserver {
  constructor (component, options, intersectionCtx) {
    this.component = component
    this.options = options
    this.thresholds = options.thresholds.sort((a,b ) => a-b) || [0]
    this.initialRatio = options.initialRatio || 0
    // TODO这个没用, observe的时候看是否可以传入一个数组
    this.observeAll = options.observeAll || false
    // this.nativeMode = options.nativeMode || false

    this.observerRef = null
    this.relativeRef = null
    this.margins = {top: 0, bottom: 0, left: 0, right: 0}
    this.callback = noop

    this.throttleMeasure = this.getThrottleMeasure()

    // 记录上一次相交的比例
    this.previousIntersectionRatio = []

    // 用来存储与scroll-view相关的上下文相关内容
    this.intersectionCtx = intersectionCtx
    
    return this
  }
  relativeTo (selector, margins) {
    const relativeRef = this.component.__selectRef(selector, 'node')
    if (isArray(relativeRef)) {
      this.relativeRef = relativeRef[0]
    } else {
      this.relativeRef = relativeRef
    }
    if (relativeRef) {
      this.relativeRef = relativeRef
      this.margins = margins || this.margins
    }
    return this
  }
  relativeToViewport(margins) {
    this.relativeRef = null
    this.margins = margins || this.margins
    return this
  }
  observe (selector, callback) {
    let targetRef = null
    if (this.observeAll){
      targetRef = this.component.__selectRef(selector, 'node', true)
    } else {
      targetRef = this.component.__selectRef(selector, 'node')
    }
    if (!targetRef || targetRef.length === 0) console.error('intersection observer target not found')
    this.observerRef = isArray(targetRef) ? targetRef : [targetRef]
    this.callback = callback
    this._measureTarget(true)

    // 添加实例添加到上下文中，滚动组件可以获取到上下文内的实例从而触发滚动
    if (this.intersectionCtx && Array.isArray(this.intersectionCtx)) {
      this.intersectionCtx.push(this.throttleMeasure)
    }

    return this
  }
  _getWindowRect() {
    const window = Dimensions.get('window');
    return {
      top: this.margins.top,
      bottom: window.height - this.margins.bottom,
      left: this.margins.left,
      right:  window.width - this.margins.right
    }
  }
  _getReferenceRect(targetRef) {
    if (!targetRef) {
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
              resolve(boundingClientRect);
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
  getThrottleMeasure(throttleTime = 100) {
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
        // console.log('_measureIntersection success', {intersectionRatio, intersectionRect} )
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
  };

  relativeToViewport (margins) {
    this._relativeInfo = { relativeRef: null, margins }
    return this
  }
  disconnect () {
    if (this.intersectionCtx && this.intersectionCtx.indexOf(this) > -1) {
      this.intersectionCtx.splice(this.intersectionCtx.indexOf(this), 1)
    }
  }
}

export default RNIntersectionObserver
