import { useEffect, useRef } from 'react'

export const WEBVIEW_TARGET = '@@WEBVIEW_TARGET'

export const constructors: Record<string, any> = {}

export const ID = () => Math.random().toString(32).slice(2)

const SPECIAL_CONSTRUCTOR: Record<string, { className: string, paramNum: number }> = {
  ImageData: {
    className: 'Uint8ClampedArray',
    paramNum: 0
  }
}

interface Instance {
  postMessage: (message: WebviewMessage) => void
  addMessageListener?: (listener: MessageListener) => void
  onConstruction?:(...args: any[]) => void
  constructLocally?:(...args: unknown[]) => void
  forceUpdate?: () => void
  [WEBVIEW_TARGET]?: string
  [key: string]: any
}

export interface WebviewMessage {
  type: 'set' | 'exec' | 'listen' | 'event'
  payload: {
    target?: string | { [WEBVIEW_TARGET]: string, [key: string]: any }
    key?: string
    value?: any
    method?: string
    args?: any[]
    types?: string[]
    type?: string
  }
}

type MessageListener = (message: WebviewMessage) => void

export const registerWebviewTarget = (instance: Instance, targetName: string): void => {
  instance[WEBVIEW_TARGET] = targetName
}

export const registerWebviewProperties = (instance: Instance, properties: Record<string, any>): void => {
  Object.entries(properties).forEach(([key, initialValue]) => {
    const privateKey = `__${key}__`
    instance[privateKey] = initialValue
    Object.defineProperty(instance, key, {
      configurable: true,
      enumerable: true,
      get () {
        return instance[privateKey]
      },
      set (value) {
        instance.postMessage({
          type: 'set',
          payload: {
            target: instance[WEBVIEW_TARGET],
            key,
            value
          }
        })

        if (instance.forceUpdate) {
          instance.forceUpdate()
        }
        return (instance[privateKey] = value)
      }
    })
  })
}

export const registerWebviewMethods = (instance: Instance, methods: string[]): void => {
  methods.forEach(method => {
    instance[method] = (...args: any[]) => {
      return instance.postMessage({
        type: 'exec',
        payload: {
          target: instance[WEBVIEW_TARGET],
          method,
          args
        }
      })
    }
  })
}

export const registerWebviewConstructor = (instance: Instance, constructorName: string): void => {
  constructors[constructorName] = instance
  instance.constructLocally = function (...args: unknown[]): Instance {
    return new (instance as any)(...args, true)
  }

  instance.prototype.onConstruction = function (...args: any[]): void {
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
  instance.prototype.toJSON = function () {
    return { __ref__: this[WEBVIEW_TARGET] }
  }
}
export const useWebviewBinding = ({
  targetName,
  properties = {},
  methods = []
}: {
  targetName: string;
  properties?: Record<string, any>;
  methods?: string[];
  constructorName?: string
}) => {
  const instanceRef = useRef({})

  useEffect(() => {
    if (instanceRef.current) {
      registerWebviewTarget(instanceRef.current as Instance, targetName)
      registerWebviewProperties(instanceRef.current as Instance, properties)
      registerWebviewMethods(instanceRef.current as Instance, methods)
    }
  }, [targetName, properties, methods])

  return instanceRef
}
