import { useEffect, useRef } from 'react'
import { WebView } from 'react-native-webview'
import Bus from './Bus'

export const WEBVIEW_TARGET = '@@WEBVIEW_TARGET'

export const constructors: Record<string, any> = {}

export const ID = () => Math.random().toString(32).slice(2)

const SPECIAL_CONSTRUCTOR: Record<string, { className: string, paramNum: number }> = {
  ImageData: {
    className: 'Uint8ClampedArray',
    paramNum: 0
  }
}

export interface Instance {
  postMessage: (...args: any[]) => void;
  [WEBVIEW_TARGET]?: string;
  [key: string]: any;
}

export interface WebviewConstructor {
  new (...args: any[]): Instance;
  constructLocally?: (...args: unknown[]) => Instance;
}

export interface WebviewMessage {
  type: 'set' | 'exec' | 'listen' | 'event' | 'construct'
  payload: {
    target?: string | { [key: string]: any }
    key?: string
    value?: any
    method?: string
    args?: any[]
    types?: string[]
    type?: string
    constructor?: string | Function
    id?: string
  }
}

export interface CanvasInstance {
  webview: WebView | null;
  bus: Bus | null;
  context2D: CanvasRenderingContext2D;
  getContext: (contextType: string) => CanvasRenderingContext2D | null;
  createImage: (width?: number, height?: number) => any;
  postMessage: (message: WebviewMessage) => Promise<any>;
  listeners: Array<(payload: any) => void>;
  addMessageListener: (listener: (payload: any) => void) => () => void;
  removeMessageListener: (listener: (payload: any) => void) => void;
  createImageData: (dataArray: number[], width?: number, height?: number) => any;
}

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

export const registerWebviewConstructor = (constructor: WebviewConstructor, constructorName: string): void => {
  constructors[constructorName] = constructor
  constructor.constructLocally = function (...args: unknown[]): Instance {
    return new (constructor as any)(...args, true)
  }

  constructor.prototype.onConstruction = function (...args: any[]): void {
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
  constructor.prototype.toJSON = function () {
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
  methods?: string[]
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
