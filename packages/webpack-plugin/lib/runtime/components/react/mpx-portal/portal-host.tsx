import { useEffect, useRef, ReactNode, useMemo, useContext } from 'react'
import {
  View,
  DeviceEventEmitter,
  NativeEventEmitter,
  StyleSheet
} from 'react-native'
import PortalManager from './portal-manager'
import { PortalContext, RouteContext } from '../context'
import type { PortalMeta } from '../context'

type PortalHostProps = {
  children: ReactNode,
  pageId: number
}

interface PortalManagerContextValue {
  mount: (key: number, children: React.ReactNode, meta?: PortalMeta) => void
  update: (key: number, children: React.ReactNode, meta?: PortalMeta) => void
  unmount: (key: number) => void
}

export type Operation =
  | { type: 'mount'; key: number; children: ReactNode; meta?: PortalMeta }
  | { type: 'update'; key: number; children: ReactNode; meta?: PortalMeta }
  | { type: 'unmount'; key: number }

// events
const addType = 'MPX_RN_ADD_PORTAL'
const removeType = 'MPX_RN_REMOVE_PORTAL'
const updateType = 'MPX_RN_UPDATE_PORTAL'
// fix react native web does not support DeviceEventEmitter
const TopViewEventEmitter = DeviceEventEmitter || new NativeEventEmitter()

const styles = StyleSheet.create({
  container: {
    flex: 1
  }
})

class PortalGuard {
  private nextKey = 10000
  add = (e: ReactNode, id: number|null, meta?: PortalMeta) => {
    const key = this.nextKey++
    TopViewEventEmitter.emit(addType, e, key, id, meta)
    return key
  }

  remove = (key: number) => {
    TopViewEventEmitter.emit(removeType, key)
  }

  update = (key: number, e: ReactNode, meta?: PortalMeta) => {
    TopViewEventEmitter.emit(updateType, key, e, meta)
  }
}
/**
 * portal
 */
export const portal = new PortalGuard()

const PortalHost = ({ children } :PortalHostProps): JSX.Element => {
  const _nextKey = useRef(0)
  const manager = useRef<PortalManagerContextValue | null>(null)
  const queue = useRef<Array<{ type: string, key: number; children: ReactNode; meta?: PortalMeta }>>([])
  const { pageId } = useContext(RouteContext) || {}
  const mount = (children: ReactNode, _key?: number, id?: number|null, meta?: PortalMeta) => {
    if (id !== pageId) return
    const key = _key || _nextKey.current++
    if (manager.current) {
      manager.current.mount(key, children, meta)
    } else {
      queue.current.push({ type: 'mount', key, children, meta })
    }
    return key
  }

  const unmount = (key: number) => {
    if (manager.current) {
      manager.current.unmount(key)
    } else {
      queue.current.push({ type: 'unmount', key, children })
    }
  }

  const update = (key: number, children?: ReactNode, meta?: PortalMeta) => {
    if (manager.current) {
      manager.current.update(key, children, meta)
    } else {
      const operation = { type: 'mount', key, children, meta }
      const index = queue.current.findIndex((q) => q.type === 'mount' && q.key === key)
      if (index > -1) {
        queue.current[index] = operation
      } else {
        queue.current.push(operation)
      }
    }
  }
  const subScriptions = useMemo(() => {
    return [
      TopViewEventEmitter.addListener(addType, mount),
      TopViewEventEmitter.addListener(removeType, unmount),
      TopViewEventEmitter.addListener(updateType, update)
    ]
  }, [])
  useEffect(() => {
    while (queue.current.length && manager.current) {
      const operation = queue.current.shift()
      if (!operation) return
      switch (operation.type) {
        case 'mount':
          manager.current.mount(operation.key, operation.children, operation.meta)
          break
        case 'unmount':
          manager.current.unmount(operation.key)
          break
      }
    }

    return () => {
      subScriptions.forEach((subScription:any) => {
        subScription.remove()
      })
    }
  }, [])
  return (
    <PortalContext.Provider
      value={{
        mount,
        update,
        unmount
      }}
      >
      <View style={styles.container} collapsable={false}>
        {children}
      </View>
      <PortalManager ref={manager} />
    </PortalContext.Provider>
  )
}

export default PortalHost
