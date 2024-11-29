function processModel (listeners, context) {
  // 该函数只有wx:model的情况下才调用，而且默认e.detail.value有值
  // 该函数必须在产生merge前执行
  // todo 此处对于$attrs的访问会导致父组件更新时子组件必然更新，暂时用短路效应避免影响，待优化
  // todo 访问$listeners也会导致上述现象，但是为了事件代理还必须访问$listeners，待后续思考处理

  const modelEvent = context.$attrs.mpxModelEvent
  if (modelEvent) {
    // 对于modelEvent，内部获得时间后向外部转发，触发外部listener的同时转发为mpxModel事件
    listeners[modelEvent] = function (e) {
      context.$emit('mpxModel', e)
      context.$emit(modelEvent, e)
    }
    // 内部listener不需要mpxModel
    delete listeners.mpxModel
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
  extendEvent(ne, {
    timeStamp: oe.timeStamp,
    target: oe.target,
    currentTarget: oe.currentTarget,
    stopPropagation: oe.stopPropagation.bind(oe),
    preventDefault: oe.preventDefault.bind(oe)
  })
  return ne
}

export function getCustomEvent (type, detail = {}, target = null) {
  const targetEl = (target && target.$el) || null
  const targetInfo = targetEl ? { target: targetEl, currentTarget: targetEl } : {}
  return {
    type,
    detail,
    timeStamp: new Date().valueOf(),
    ...targetInfo
  }
}

function noop () {

}

export default function getInnerListeners (context, options = {}) {
  let { mergeBefore = {}, mergeAfter = {}, defaultListeners = [], ignoredListeners = [] } = options
  const listeners = Object.assign({}, context.$listeners)
  defaultListeners.forEach((key) => {
    if (!listeners[key]) listeners[key] = noop
  })
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
  mergeListeners(listeners, mergeBefore, mergeBeforeOptions)
  mergeListeners(listeners, mergeAfter, mergeAfterOptions)
  ignoredListeners.forEach((key) => {
    delete listeners[key]
  })
  return listeners
}
