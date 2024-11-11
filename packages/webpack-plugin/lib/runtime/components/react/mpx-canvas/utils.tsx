import { useEffect, useRef } from 'react'

export const WEBVIEW_TARGET = '@@WEBVIEW_TARGET'

export const constructors: Record<string, any> = {}

export const ID = () => Math.random().toString(32).slice(2)

interface WebviewInstance {
  [WEBVIEW_TARGET]: string
  [key: string]: any
  postMessage: (message: WebviewMessage) => void
  forceUpdate?: () => void
  addMessageListener: (listener: MessageListener) => void
}

interface WebviewMessage {
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

export const registerWebviewTarget = (instance: WebviewInstance, targetName: string): void => {
  instance[WEBVIEW_TARGET] = targetName
}

export const registerWebviewProperties = (instance: WebviewInstance, properties: Record<string, any>): void => {
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

export const registerWebviewMethods = (instance: WebviewInstance, methods: string[]): void => {
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

export const registerWebviewConstructor = (instance: WebviewInstance, constructorName: string) => {
  constructors[constructorName] = instance
  instance.constructLocally = function (...args) {
    // Pass noOnConstruction
    return new instance(...args, true)
  }
  /**
   * Arguments should be identical to the arguments passed to the constructor
   * just without the canvas instance
   */
  instance.prototype.onConstruction = function (...args) {
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
  const instanceRef = useRef<WebviewInstance>({})

  useEffect(() => {
    if (instanceRef.current) {
      registerWebviewTarget(instanceRef.current, targetName)
      registerWebviewProperties(instanceRef.current, properties)
      registerWebviewMethods(instanceRef.current, methods)
    }
  }, [targetName, properties, methods])

  return instanceRef
}
