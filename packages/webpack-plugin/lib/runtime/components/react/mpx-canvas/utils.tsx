import { useEffect, useRef } from 'react'

export const WEBVIEW_TARGET = '@@WEBVIEW_TARGET'

export const constructors = {}

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

const setupWebviewTarget = (instance: WebviewInstance, targetName: string): void => {
  instance[WEBVIEW_TARGET] = targetName
}

const setupWebviewProperties = (instance: WebviewInstance, properties: Record<string, any>): void => {
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

const setupWebviewMethods = (instance: WebviewInstance, methods: string[]): void => {
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

export const useWebviewBinding = ({
  targetName,
  properties = {},
  methods = [],
  constructorName = ''
}: {
  targetName: string;
  properties?: Record<string, any>;
  methods?: string[];
  constructorName?: string
}) => {
  const instanceRef = useRef<WebviewInstance>({})

  useEffect(() => {
    if (instanceRef.current) {
      setupWebviewTarget(instanceRef.current, targetName)
      setupWebviewProperties(instanceRef.current, properties)
      setupWebviewMethods(instanceRef.current, methods)
    }
  }, [targetName, properties, methods])

  return instanceRef
}
