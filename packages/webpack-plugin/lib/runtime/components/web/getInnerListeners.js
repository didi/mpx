function processModel (listeners, context) {
  // 该函数只有wx:model的情况下才调用，而且默认e.detail.value有值
  // 该函数必须在产生merge前执行
  // todo 此处对于$attrs的访问会导致父组件更新时子组件必然更新，暂时用短路效应避免影响，待优化
  // todo 访问$listeners也会导致上述现象，但是为了事件代理还必须访问$listeners，待后续思考处理
  // todo 此处的__model对于特定组件声明为props传递能够规避上述问题
  if (!listeners.input || !context.$attrs.__model) {
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
            const re = inheritEvent('longpress', e, detail)
            context.$emit('longpress', re)
          }
          if (listeners.longtap) {
            const re = inheritEvent('longtap', e, detail)
            context.$emit('longtap', re)
          }
        }, 350)
      }
    },
    touchend (e) {
      // debugger
      startTimer && clearTimeout(startTimer)
      if (listeners.tap && needTap) {
        const re = inheritEvent('tap', e, detail)
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

export function inheritEvent (type, oe, detail = {}) {
  detail = Object.assign({}, oe.detail, detail)
  const ne = getCustomEvent(type, detail)
  ne.stopPropagation = oe.stopPropagation.bind(oe)
  ne.preventDefault = oe.preventDefault.bind(oe)
  return ne
}

export function getCustomEvent (type, detail = {}) {
  /* eslint-disable no-undef */
  const ce = new CustomEvent(type, { detail })
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
