import { useRef, useEffect, useImperativeHandle, RefObject, ForwardedRef } from 'react'


type Obj = Record<string, any>

export type HandlerRef<T, P> = {
  getNodeInstance(): {
    props: RefObject<P>,
    nodeRef: RefObject<T>,
    instance: Obj
  }
}

export default function useNodesRef<T, P>(props: P, ref: ForwardedRef<HandlerRef<T, P>>, instance:Obj = {} ) {
  const nodeRef = useRef<T>(null)
  const _props = useRef<P | null>(props)

  useEffect(() => {
    _props.current = props
    return () => {
      _props.current = null // 组件销毁，清空 _props 依赖数据
    }
  }, [props])
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
