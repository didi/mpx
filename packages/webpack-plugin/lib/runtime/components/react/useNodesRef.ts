import { useRef, useImperativeHandle, RefObject, ForwardedRef } from 'react'
import { useAnimatedRef } from 'react-native-reanimated'

type Obj = Record<string, any>

export type HandlerRef<T, P> = {
  getNodeInstance(): {
    props: RefObject<P>,
    nodeRef: RefObject<T>,
    instance: Obj
  }
}

export default function useNodesRef<T, P>(props: P, ref: ForwardedRef<HandlerRef<T, P>>, instance:Obj = {}, config:Obj = {}) {
  let nodeRef

  if (config.isAnimatedRef) {
    nodeRef = useAnimatedRef<T>(null)
  } else {
    nodeRef = useRef<T>(null)
  }
  const _props = useRef<P | null>(null)
  _props.current = props

  useImperativeHandle(ref, () => {
    return {
      getNodeInstance () {
        return {
          props: _props,
          nodeRef,
          instance
        }
      }
    }
  })

  return {
    nodeRef
  }
}
