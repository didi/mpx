import { useRef, useEffect, useImperativeHandle } from 'react'

export default function useNodesRef (ref, props, instance = {}) {
  const nodeRef = useRef(null)
  const _props = useRef(props)

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
