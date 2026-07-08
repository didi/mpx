import { useState, useCallback, useRef, forwardRef, ForwardedRef, useImperativeHandle, ReactNode, ReactElement, Fragment } from 'react'
import { View, StyleSheet } from 'react-native'
import type { PortalMeta } from '../context'

export type State = {
  portals: Array<{
    key: number
    children: ReactNode
    stackPath?: number[]
    order: number
  }>
}

type PortalManagerProps = {
}

type PortalItem = State['portals'][number]

const styles = StyleSheet.create({
  portal: {
    ...StyleSheet.absoluteFillObject
  }
})

const compareStackPath = (left: number[], right: number[]) => {
  const minLength = Math.min(left.length, right.length)
  for (let i = 0; i < minLength; i++) {
    if (left[i] !== right[i]) return left[i] - right[i]
  }
  if (left.length === right.length) return 0

  const lengthDiff = left.length - right.length
  const longer = lengthDiff > 0 ? left : right
  for (let i = minLength; i < longer.length; i++) {
    if (longer[i]) return lengthDiff > 0 ? longer[i] : -longer[i]
  }

  return lengthDiff
}

const comparePortalItems = (left: PortalItem, right: PortalItem) => {
  if (left.stackPath && right.stackPath) {
    return compareStackPath(left.stackPath, right.stackPath) || left.order - right.order
  }
  return left.order - right.order
}

const _PortalManager = forwardRef((props: PortalManagerProps, ref:ForwardedRef<unknown>): ReactElement => {
  const [state, setState] = useState<State>({
    portals: []
  })
  const orderRef = useRef(0)

  const mount = useCallback((key: number, children: ReactNode, meta?: PortalMeta) => {
    const order = orderRef.current++
    setState((prevState) => ({
      portals: [...prevState.portals, { key, children, stackPath: meta?.stackPath, order }]
    }))
  }, [])

  const update = useCallback((key: number, children: ReactNode, meta?: PortalMeta) => {
    setState((prevState) => ({
      portals: prevState.portals.map((item) => {
        if (item.key === key) {
          return Object.assign({}, item, { children }, meta ? { stackPath: meta.stackPath } : {})
        }
        return item
      })
    }))
  }, [])

  const unmount = useCallback((key: number) => {
    setState((prevState) => ({
      portals: prevState.portals.filter((item) => item.key !== key)
    }))
  }, [])

  useImperativeHandle(ref, () => ({
    mount,
    update,
    unmount,
    portals: state.portals
  }))

  return (
    <>
      {[...state.portals].sort(comparePortalItems).map(({ key, children, stackPath }, index) => (
        <Fragment key={key}>
          {stackPath
            ? <View pointerEvents='box-none' style={[styles.portal, { zIndex: index }]}>{children}</View>
            : children}
        </Fragment>
      ))}
    </>
  )
})

export default _PortalManager
