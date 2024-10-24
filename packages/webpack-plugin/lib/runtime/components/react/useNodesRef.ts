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

export default function useNodesRe<T extends React.Component<any, any>, P> (nodeRef: RefObject<T>, props: P, ref: ForwardedRef<HandlerRef<T, P>>, instance:Obj = {}) {
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
