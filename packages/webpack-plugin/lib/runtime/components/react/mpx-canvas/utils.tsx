import { useEffect, useRef } from 'react'

export const WEBVIEW_TARGET = '@@WEBVIEW_TARGET'

export const constructors: Record<string, any> = {}

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

const setupWebviewEvents = (instance: WebviewInstance, eventTypes: string[]): void => {
  if (eventTypes.length > 0) {
    instance.postMessage({
      type: 'listen',
      payload: {
        types: eventTypes,
        target: instance[WEBVIEW_TARGET]
      }
    })

    instance.addEventListener = function (type: string, callback: (event: any) => void) {
      this.addMessageListener((message: WebviewMessage) => {
        if (
          message &&
          message.type === 'event' &&
          message.payload.target &&
          typeof message.payload.target === 'object' &&
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
}

export const useWebviewBinding = (
  targetName: string,
  properties: Record<string, any> = {},
  methods: string[] = [],
  eventTypes: string[] = []
) => {
  const instanceRef = useRef<WebviewInstance>({})

  useEffect(() => {
    if (instanceRef.current) {
      setupWebviewTarget(instanceRef.current, targetName)
      setupWebviewProperties(instanceRef.current, properties)
      setupWebviewMethods(instanceRef.current, methods)
      setupWebviewEvents(instanceRef.current, eventTypes)
    }
  }, [targetName, properties, methods, eventTypes])

  return instanceRef
}
