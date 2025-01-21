import { useEffect, useRef, ReactNode, useMemo } from 'react'
import {
  View,
  DeviceEventEmitter,
  EventSubscription,
  NativeEventEmitter,
  StyleSheet
} from 'react-native'
import PortalManager from './portal-manager'
import { useNavigation } from '@react-navigation/native'
import { PortalManagerContextValue, PortalContext } from '../context'

export type PortalHostProps = {
  children: ReactNode,
  pageId: number
}

type addIdsMapsType = {
  [key: number]: number[]
}

export type Operation =
  | { type: 'mount'; key: number; children: ReactNode }
  | { type: 'update'; key: number; children: ReactNode }
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
  add = (e: ReactNode, id: number) => {
    const key = this.nextKey++
    TopViewEventEmitter.emit(addType, e, key, id)
    return key
  }

  remove = (key: number) => {
    TopViewEventEmitter.emit(removeType, key)
  }

  update = (key: number, e: ReactNode) => {
    TopViewEventEmitter.emit(updateType, key, e)
  }
}
/**
 * portal
 */
export const portal = new PortalGuard()

const PortalHost = ({ children, pageId } :PortalHostProps): JSX.Element => {
  const isMounted = useRef<boolean>(false)
  const _nextKey = useRef(0)
  const _addType = useRef<EventSubscription | null>(null)
  const _removeType = useRef<EventSubscription | null>(null)
  const _updateType = useRef<EventSubscription | null>(null)
  const manager = useRef<PortalManagerContextValue | null>(null)
  const queue = useRef<Array<{ type: string, key: number; children: ReactNode }>>([])
  const _mount = (children: ReactNode, _key?: number, id?: number) => {
    if (id !== pageId) return
    const key = _key || _nextKey.current++
    if (!isMounted.current) {
      queue.current.push({ type: 'mount', key, children })
    } else if (manager.current) {
      manager.current.mount(key, children)
    }
    return key
  }

  const _unmount = (key: number) => {
    if (!isMounted.current) {
      queue.current.push({ type: 'unmount', key, children })
    } else if (manager.current) {
      manager.current.unmount(key)
    }
  }

  const _update = (key: number, children?: ReactNode) => {
    if (!isMounted.current) {
      const operation = { type: 'mount', key, children }
      const index = queue.current.findIndex((q) => q.key === key)
      if (index > -1) {
        queue.current[index] = operation
      } else {
        queue.current.push(operation)
      }
    } else if (manager.current) {
      manager.current.update(key, children)
    }
  }

  const mount = (children: ReactNode, _key?: number) => {
    const key = _key || _nextKey.current++
    if (manager.current) {
      manager.current.mount(key, children)
    }
    return key
  }

  const unmount = (key: number) => {
    if (manager.current) {
      manager.current.unmount(key)
    }
  }

  const update = (key: number, children?: ReactNode) => {
    if (manager.current) {
      manager.current.update(key, children)
    }
  }

  useMemo(() => {
    _addType.current = TopViewEventEmitter.addListener(addType, _mount)
    _removeType.current = TopViewEventEmitter.addListener(removeType, _unmount)
    _updateType.current = TopViewEventEmitter.addListener(updateType, _update)
  }, [])
  const navigation = useNavigation()
  useEffect(() => {
    while (queue.current.length && manager.current) {
      const operation = queue.current.shift()
      if (!operation) return
      switch (operation.type) {
        case 'mount':
          manager.current.mount(operation.key, operation.children)
          break
        case 'unmount':
          manager.current.unmount(operation.key)
      }
    }
    const focusSubscription = navigation.addListener('focus', () => {
      isMounted.current = true
    })

    return () => {
      _addType.current?.remove()
      _removeType.current?.remove()
      _updateType.current?.remove()
      focusSubscription()
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
