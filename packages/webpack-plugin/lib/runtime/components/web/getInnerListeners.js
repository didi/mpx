function processModel (listeners, context) {
  // 该函数只有wx:model的情况下才调用，而且默认e.detail.value有值
  // 该函数必须在产生merge前执行

  const attrs = context.$attrs
  if (!attrs.__model || !listeners.input) {
    return
  }
  const isArr = Array.isArray(listeners.input.fns)
  if (isArr) {
    const rawModelListener = listeners.input.fns[0]
    listeners.input.fns[0] = function (e) {
      rawModelListener.call(this, e.detail.value)
    }
  } else {
    const rawModelListener = listeners.input.fns
    listeners.input.fns = function (e) {
      rawModelListener.call(this, e.detail.value)
    }
  }
}

function mergeListeners (listeners, otherListeners, options = {}) {
  if (!otherListeners) {
    return
  }
  Object.keys(otherListeners).forEach((key) => {
    const rawListener = listeners[key]
    const listener = otherListeners[key]
    if (!rawListener) {
      if (options.force) {
        listeners[key] = listener
      }
    } else {
      listeners[key] = function (e) {
        if (options.before) {
          listener.call(this, e)
          rawListener.call(this, e)
        } else {
          rawListener.call(this, e)
          listener.call(this, e)
        }
      }
    }
  })
}

function processTap (listeners, context) {
  if (!(listeners.tap || listeners.longpress || listeners.longtap)) {
    return
  }
  let startTimer
  let needTap = true
  mergeListeners(listeners, {
    touchstart (e) {
      if (listeners.longpress || listeners.longtap) {
        const detail = {
          x: e.touches[0].pageX,
          y: e.touches[0].pageY
        }
        startTimer = setTimeout(() => {
          needTap = false
          if (listeners.longpress) {
            const re = Object.assign({}, e, {
              type: 'longpress',
              detail
            })
            context.$emit('longpress', re)
          }
          if (listeners.longtap) {
            const re = Object.assign({}, e, {
              type: 'longtap',
              detail
            })
            context.$emit('longtap', re)
          }
        }, 350)
      }
    },
    touchend (e) {
      startTimer && clearTimeout(startTimer)
      if (needTap) {
        if (listeners.tap && needTap) {
          const detail = {
            x: e.touches[0].pageX,
            y: e.touches[0].pageY
          }
          const re = Object.assign({}, e, {
            type: 'tap',
            detail
          })
          context.$emit('tap', re)
        }
      }
    }
  })
}

export function extendDetail (e, detail) {
  // 为了让冒泡事件同样能访问到e.detail，这里直接对e进行修改而不采用新的事件对象
  Object.defineProperty(e, 'detail', {
    value: detail,
    enumerable: true,
    configurable: true,
    writable: true
  })
}

export default function getInnerListeners (context, mergeBefore = {}, mergeAfter = {}) {
  const listeners = Object.assign({}, context.$listeners)
  const mergeBeforeOptions = {
    before: true
  }
  const mergeAfterOptions = {
    before: false
  }

  if (mergeBefore.listeners) {
    mergeBeforeOptions.force = mergeBefore.force
    mergeBefore = mergeBefore.listeners
  }

  if (mergeAfter.listeners) {
    mergeAfterOptions.force = mergeAfter.force
    mergeAfter = mergeAfter.listeners
  }

  processModel(listeners, context)
  processTap(listeners, context)
  mergeListeners(listeners, mergeBefore, mergeBeforeOptions)
  mergeListeners(listeners, mergeAfter, mergeAfterOptions)
  return listeners
}
