import { useRef, useEffect, useImperativeHandle, ForwardedRef } from 'react'

export type HandlerRef = {
  getNodeInstance(): any
}

type Obj = Record<string, any>

export default function useNodesRef<T, P>(props: P, ref: ForwardedRef<HandlerRef>, instance:Obj = {} ) {
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
