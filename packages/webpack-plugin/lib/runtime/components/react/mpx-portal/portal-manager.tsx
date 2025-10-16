import { useState, useCallback, forwardRef, ForwardedRef, useImperativeHandle, ReactNode, ReactElement, Fragment } from 'react'
import { View } from 'react-native'

export type State = {
  portals: Array<{
    key: number
    children: ReactNode
  }>
}

type PortalManagerProps = {}

const _PortalManager = forwardRef((props: PortalManagerProps, ref: ForwardedRef<unknown>): ReactElement => {
  const manager = usePortalHostManager()

  useImperativeHandle(ref, () => manager)

  return (
    <>
      {manager.portals.map(({ key, children }) => (
        <Fragment key={key}>
          {children}
        </Fragment>
      ))}
    </>
  )
})

export default _PortalManager

export function usePortalHostManager() {
  const [state, setState] = useState<State>({
    portals: []
  })

  const mount = useCallback((key: number, children: ReactNode) => {
    setState(prevState => ({
      portals: [...prevState.portals, { key, children }]
    }))
  }, [])

  const update = useCallback((key: number, children: ReactNode) => {
    setState(prevState => ({
      portals: prevState.portals.map(item => {
        if (item.key === key) {
          return Object.assign({}, item, { children })
        }
        return item
      })
    }))
  }, [])

  const unmount = useCallback((key: number) => {
    setState(prevState => ({
      portals: prevState.portals.filter(item => item.key !== key)
    }))
  }, [])

  return {
    portals: state.portals,
    mount,
    update,
    unmount
  }
}
