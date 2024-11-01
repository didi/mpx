import { useEffect, useRef } from 'react'

export const WEBVIEW_TARGET = '@@WEBVIEW_TARGET'

/**
 * @mutable
 */
export const constructors = {}

const ID = () => Math.random().toString(32).slice(2)

/**
 * 特殊构造函数配置
 */
const SPECIAL_CONSTRUCTOR = {
  ImageData: {
    className: 'Uint8ClampedArray',
    paramNum: 0
  }
}

/**
 * 保留原来的装饰器函数，因为它们在实例化时使用
 */
export const webviewTarget = (targetName) => (target) => {
  target.prototype[WEBVIEW_TARGET] = targetName
}

export const webviewConstructor = (constructorName) => (target) => {
  constructors[constructorName] = target
  target.constructLocally = function (...args) {
    return new target(...args, true)
  }

  target.prototype.onConstruction = function (...args) {
    if (SPECIAL_CONSTRUCTOR[constructorName] !== undefined) {
      const { className, paramNum } = SPECIAL_CONSTRUCTOR[constructorName]
      args[paramNum] = { className, classArgs: [args[paramNum]] }
    }
    this[WEBVIEW_TARGET] = ID()
    this.postMessage({
      type: 'construct',
      payload: {
        constructor: constructorName,
        id: this[WEBVIEW_TARGET],
        args
      }
    })
  }

  target.prototype.toJSON = function () {
    return { __ref__: this[WEBVIEW_TARGET] }
  }
}

export const webviewMethods = (methods) => (target) => {
  for (const method of methods) {
    target.prototype[method] = function (...args) {
      return this.postMessage({
        type: 'exec',
        payload: {
          target: this[WEBVIEW_TARGET],
          method,
          args
        }
      })
    }
  }
}

export const webviewProperties = (properties) => (target) => {
  for (const key of Object.keys(properties)) {
    const initialValue = properties[key]
    const privateKey = `__${key}__`
    target.prototype[privateKey] = initialValue
    Object.defineProperty(target.prototype, key, {
      get () {
        return this[privateKey]
      },
      set (value) {
        this.postMessage({
          type: 'set',
          payload: {
            target: this[WEBVIEW_TARGET],
            key,
            value
          }
        })

        if (this.forceUpdate) {
          this.forceUpdate()
        }

        return (this[privateKey] = value)
      }
    })
  }
}

export const webviewEvents = (types) => (target) => {
  const { onConstruction } = target.prototype
  target.prototype.onConstruction = function () {
    if (onConstruction) {
      onConstruction.call(this)
    }
    this.postMessage({
      type: 'listen',
      payload: {
        types,
        target: this[WEBVIEW_TARGET]
      }
    })
  }
  target.prototype.addEventListener = function (type, callback) {
    this.addMessageListener((message) => {
      if (
        message &&
        message.type === 'event' &&
        message.payload.target[WEBVIEW_TARGET] === this[WEBVIEW_TARGET] &&
        message.payload.type === type
      ) {
        for (const key in message.payload.target) {
          const value = message.payload.target[key]
          if (key in this && this[key] !== value) {
            this[key] = value
          }
        }
        callback({
          ...message.payload,
          target: this
        })
      }
    })
  }
}

export const useWebviewBinding = (targetName, properties = {}, methods = [], eventTypes = []) => {
  const instanceRef = useRef(null)

  useEffect(() => {
    if (instanceRef.current) {
      // 设置target
      instanceRef.current[WEBVIEW_TARGET] = targetName

      // 设置properties
      Object.entries(properties).forEach(([key, initialValue]) => {
        const privateKey = `__${key}__`
        instanceRef.current[privateKey] = initialValue
      })

      // 设置methods
      methods.forEach(method => {
        instanceRef.current[method] = (...args) => {
          return instanceRef.current.postMessage({
            type: 'exec',
            payload: {
              target: instanceRef.current[WEBVIEW_TARGET],
              method,
              args
            }
          })
        }
      })

      // 设置events
      if (eventTypes.length > 0) {
        instanceRef.current.postMessage({
          type: 'listen',
          payload: {
            types: eventTypes,
            target: instanceRef.current[WEBVIEW_TARGET]
          }
        })
      }
    }
  }, [targetName, properties, methods, eventTypes])

  return instanceRef
}
