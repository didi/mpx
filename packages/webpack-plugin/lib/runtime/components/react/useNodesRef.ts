import { useRef, useImperativeHandle, RefObject, ForwardedRef } from 'react'

type Obj = Record<string, any>

export type HandlerRef<T, P> = {
  getNodeInstance(): {
    props: RefObject<P>,
    nodeRef: RefObject<T>,
    instance: Obj
  }
}

export default function useNodesRef<T, P> (props: P, ref: ForwardedRef<HandlerRef<T, P>>, nodeRef: RefObject<T>, instance:Obj = {}) {
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
}
