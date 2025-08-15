import { useState, useCallback, forwardRef, ForwardedRef, useImperativeHandle, ReactNode, ReactElement, Fragment } from 'react'

export type State = {
  portals: Array<{
    key: number
    children: ReactNode
  }>
}

type PortalManagerProps = {
}

const _PortalManager = forwardRef((props: PortalManagerProps, ref:ForwardedRef<unknown>): ReactElement => {
  const [state, setState] = useState<State>({
    portals: []
  })

  const mount = useCallback((key: number, children: ReactNode) => {
    setState((prevState) => ({
      portals: [...prevState.portals, { key, children }]
    }))
  }, [state])

  const update = useCallback((key: number, children: ReactNode) => {
    setState((prevState) => ({
      portals: prevState.portals.map((item) => {
        if (item.key === key) {
          return Object.assign({}, item, { children })
        }
        return item
      })
    }))
  }, [state])

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
      {state.portals.map(({ key, children }) => (
        <Fragment key={key}>
          {children}
        </Fragment>
      ))}
    </>
  )
})

export default _PortalManager
