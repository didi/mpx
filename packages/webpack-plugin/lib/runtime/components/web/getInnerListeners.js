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
  let detail = {}
  mergeListeners(listeners, {
    touchstart (e) {
      detail = {
        x: e.touches[0].pageX,
        y: e.touches[0].pageY
      }
      if (listeners.longpress || listeners.longtap) {
        startTimer = setTimeout(() => {
          needTap = false
          if (listeners.longpress) {
            const re = inheritEvent(e, {
              type: 'longpress',
              detail
            })
            context.$emit('longpress', re)
          }
          if (listeners.longtap) {
            const re = inheritEvent(e, {
              type: 'longtap',
              detail
            })
            context.$emit('longtap', re)
          }
        }, 350)
      }
    },
    touchend (e) {
      // debugger
      startTimer && clearTimeout(startTimer)
      if (listeners.tap && needTap) {
        const re = inheritEvent(e, {
          type: 'tap',
          detail
        })
        context.$emit('tap', re)
      }
    }
  }, {
    force: true
  })
}

export function extendEvent (e, extendObj = {}) {
  Object.keys(extendObj).forEach((key) => {
    Object.defineProperty(e, key, {
      value: extendObj[key],
      enumerable: true,
      configurable: true,
      writable: true
    })
  })
}

export function inheritEvent (e, extendObj = {}) {
  const ne = Object.create(e)
  extendEvent(ne, extendObj)
  return ne
}

export function getCustomEvent (type, detail) {
  /* eslint-disable no-undef */
  const ce = new CustomEvent(type)
  if (detail !== undefined) {
    ce.detail = detail
  }
  return ce
}

export default function getInnerListeners (context, options = {}) {
  let { mergeBefore = {}, mergeAfter = {}, defaultListeners = {} } = options
  const listeners = Object.assign({}, defaultListeners, context.$listeners)
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
