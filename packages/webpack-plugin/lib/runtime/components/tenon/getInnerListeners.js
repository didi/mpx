import { isEmptyObject } from "./util";

const tapEvents = [
  "onTouchstart",
  "onTouchmove",
  "onTouchcancel",
  "onTouchend",
  "onLongtap",
];

function createTouch(context, hasLongTap, __mpxTapInfo) {
  return ({
    onTouch(e) {
      // 用touch模拟longtap
      switch (e.state) {
        case 1:
          context.$emit("touchstart", e);
          __mpxTapInfo.detail = {
            x: e.position.x,
            y: e.position.y,
          };
          __mpxTapInfo.startTimer = null;

          if (hasLongTap) {
            __mpxTapInfo.startTimer = setTimeout(() => {
              if (hasLongTap) {
                const re = inheritEvent(
                  "longtap",
                  e,
                  __mpxTapInfo.detail
                );
                context.$emit("longtap", re);
                __mpxTapInfo.startTimer = null;
              }
            }, 350);
          }

          break;
        case 2:
          context.$emit("touchmove", e);
          const tapDetailInfo = __mpxTapInfo.detail || {};
          const currentPageX = e.position.x;
          const currentPageY = e.position.y;
          if (
            Math.abs(currentPageX - tapDetailInfo.x) > 1 ||
            Math.abs(currentPageY - tapDetailInfo.y) > 1
          ) {
            __mpxTapInfo.startTimer &&
              clearTimeout(__mpxTapInfo.startTimer);
            __mpxTapInfo.startTimer = null;
          }
          break;
        case 3:
          context.$emit("touchend", e);
          __mpxTapInfo.startTimer &&
            clearTimeout(__mpxTapInfo.startTimer);
          __mpxTapInfo.startTimer = null;
          break;
        case 4:
          context.$emit("touchcancel", e);
          break;
      }
    },
  });
}

function processModel(listeners, context) {
  // 该函数只有wx:model的情况下才调用，而且默认e.detail.value有值
  // 该函数必须在产生merge前执行
  // todo 此处对于$attrs的访问会导致父组件更新时子组件必然更新，暂时用短路效应避免影响，待优化
  // todo 访问$listeners也会导致上述现象，但是为了事件代理还必须访问$listeners，待后续思考处理

  const modelEvent = context.$attrs.mpxModelEvent;
  if (modelEvent) {
    // 对于modelEvent，内部获得时间后向外部转发，触发外部listener的同时转发为mpxModel事件
    listeners[modelEvent] = function (e) {
      context.$emit(modelEvent, e);
      context.$emit("mpxModel", e);
    };
    // 内部listener不需要mpxModel
    delete listeners.mpxModel;
  }
}

function mergeListeners(listeners, otherListeners, options = {}, context, __mpxTapInfo) {
  if (!otherListeners) {
    return;
  }
  // "onTouchstart",
  // "onTouchmove",
  // "onTouchcancel",
  // "onTouchend",
  // "onLongtap",

  // 都依赖touch事件 如果listener没有touch事件 如果是force需要强行添加一个touch事件 longTap需要根据context
  // 特殊处理
  const listenerMap = {};
  tapEvents.forEach((eventName) => {
    if (listeners[eventName]) {
      listenerMap[eventName] = true;
      delete listeners[eventName];
    }
  });
  const otherListenerKeys = Object.keys(otherListeners)
  for(let key of otherListenerKeys) {
    
  }

  Object.keys(otherListeners).forEach((key) => {
    const listener = otherListeners[key];
    let rawListener;
    if (tapEvents.includes(key)) {
      // 判断onTouch是否存在 若存在 则直接处理
      rawListener = listeners["onTouch"];

      if (!rawListener && !options.force) {
        return;
      } else if (!rawListener && options.force) {
        // 创建一个touh事件 并赋值
        listeners["onTouch"] = createTouch(context, listenerMap.onLongtap, __mpxTapInfo).onTouch;
        rawListener = listeners["onTouch"];
      }
      // 事件处理 onTouchstart 1 onTouchmove 2 onTouchend 3 onTouchcancel 4
      listeners["onTouch"] = function (e) {
        const thatKey = key
        let timer = null;
        if (key === "onLongtap") {
          if (e.state === 1) {
            // start
            timer = setTimeout(
              () => {
                listener.call(this, e);
              },
              options.before ? 340 : 360
            );
          } else if (e.state === 3) {
            timer && clearTimeout(timer);
            timer = null;
          }
        } else {
          if (options.before) {
            if (key === "onTouchstart" && e.state === 1) {
              listener.call(this, e);
            } else if (key === "onTouchmove" && e.state === 2) {
              listener.call(this, e);
            } else if (key === "onTouchend" && e.state === 3) {
              listener.call(this, e);
            } else if (key === "onTouchcancel" && e.state === 4) {
              listener.call(this, e);
            }
            rawListener.call(this, e);
          } else {
            rawListener.call(this, e);
            if (key === "onTouchstart" && e.state === 1) {
              listener.call(this, e);
            } else if (key === "onTouchmove" && e.state === 2) {
              listener.call(this, e);
            } else if (key === "onTouchend" && e.state === 3) {
              listener.call(this, e);
            } else if (key === "onTouchcancel" && e.state === 4) {
              listener.call(this, e);
            }
          }
        }
      };
    } else {
      rawListener = listeners[key];

      if (!rawListener) {
        if (options.force) {
          listeners[key] = listener;
        }
      } else {
        listeners[key] = function (e) {
          if (options.before) {
            listener.call(this, e);
            rawListener.call(this, e);
          } else {
            rawListener.call(this, e);
            listener.call(this, e);
          }
        };
      }
    }
  });
}
// 没有tap 用touch模拟 touchstart touchmove touchcancel touchend tap longpress langtap
function processTouchAndLtap(listeners, context, __mpxTapInfo) {
  const listenerMap = {};
  tapEvents.forEach((eventName) => {
    if (listeners[eventName]) {
      listenerMap[eventName] = true;
      delete listeners[eventName];
    }
  });
  if (isEmptyObject(listenerMap)) return;
  let events = createTouch(context, listenerMap.onLongtap, __mpxTapInfo);
  mergeListeners(
    listeners,
    events,
    {
      force: true,
    },
    context,
    __mpxTapInfo
  );
}

export function extendEvent(e, extendObj = {}) {
  Object.keys(extendObj).forEach((key) => {
    Object.defineProperty(e, key, {
      value: extendObj[key],
      enumerable: true,
      configurable: true,
      writable: true,
    });
  });
}

export function inheritEvent(type, oe, detail = {}) {
  detail = Object.assign({}, oe.detail, detail);
  const ne = getCustomEvent(type, detail);
  extendEvent(ne, {
    timeStamp: oe.timeStamp,
    target: oe.target,
    currentTarget: oe.currentTarget,
    stopPropagation: oe.stopPropagation.bind(oe),
    preventDefault: oe.preventDefault.bind(oe),
  });
  return ne;
}

export function getCustomEvent(type, detail = {}, target = null) {
  return {
    type,
    detail,
    target,
    timeStamp: new Date().valueOf(),
  };
}

function noop() {}

function getListeners(context) {
  let attrs = context.$attrs;
  let listeners = {};
  let attrKeys = Object.keys(attrs).forEach((v) => {
    if (/^on[A-Z]/.test(v)) {
      listeners[v] = attrs[v];
    }
  });
  return listeners;
}

export default function getInnerListeners(context, options = {}) {
  let {
    mergeBefore = {},
    mergeAfter = {},
    defaultListeners = [],
    ignoredListeners = [],
  } = options;
  let __mpxTapInfo = {}
  // 从attrs里面拿到以on开头的所有绑定的事件
  const listeners = Object.assign({}, getListeners(context));
  defaultListeners.forEach((key) => {
    if (!listeners[key]) listeners[key] = noop;
  });
  const mergeBeforeOptions = {
    before: true,
  };
  const mergeAfterOptions = {
    before: false,
  };

  if (mergeBefore.listeners) {
    mergeBeforeOptions.force = mergeBefore.force;
    mergeBefore = mergeBefore.listeners;
  }

  if (mergeAfter.listeners) {
    mergeAfterOptions.force = mergeAfter.force;
    mergeAfter = mergeAfter.listeners;
  }
  processModel(listeners, context);
  processTouchAndLtap(listeners, context, __mpxTapInfo);
  mergeListeners(listeners, mergeBefore, mergeBeforeOptions, context, __mpxTapInfo);
  mergeListeners(listeners, mergeAfter, mergeAfterOptions, context, __mpxTapInfo);
  ignoredListeners.forEach((key) => {
    delete listeners[key];
  });
  return listeners;
}
