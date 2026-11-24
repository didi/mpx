import { useEffect, useRef, useMemo, ReactNode } from 'react'
import {
  View,
  StyleSheet
} from 'react-native'
import { getFocusedNavigation } from '@mpxjs/utils'
import PortalManager from './portal-manager'
import { PortalContext } from '../context'

type PortalHostProps = {
  children: ReactNode
  id?: HostId
}

interface PortalManagerContextValue {
  mount: (key: number, children: React.ReactNode) => void
  update: (key: number, children: React.ReactNode) => void
  unmount: (key: number) => void
}

// 页面 Host 传入 pageId，独立 Host 默认使用 symbol。
type HostId = number | symbol

interface PortalEntry {
  id: HostId | null
  children: ReactNode
  onBind?: (pageId: number) => void
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  }
})

class PortalGuard {
  private nextKey = 10000
  private hosts = new Map<HostId, PortalManagerContextValue>()
  private portals = new Map<number, PortalEntry>()

  add = (children: ReactNode, id?: HostId | null, onBind?: (pageId: number) => void) => {
    id = id ?? this.getPageId() ?? null
    const key = this.nextKey++
    this.portals.set(key, { id, children, onBind })
    if (id != null) this.hosts.get(id)?.mount(key, children)
    return key
  }

  remove = (key: number) => {
    const item = this.portals.get(key)
    if (!item) return
    this.portals.delete(key)
    if (item.id != null) this.hosts.get(item.id)?.unmount(key)
  }

  update = (key: number, children: ReactNode) => {
    const item = this.portals.get(key)
    if (!item) return
    item.children = children
    if (item.id != null) this.hosts.get(item.id)?.update(key, children)
  }

  getPageId = (key?: number): number | null | undefined => {
    if (key != null) {
      const id = this.portals.get(key)?.id
      return typeof id === 'symbol' ? undefined : id
    }
    return getFocusedNavigation()?.pageId ?? Array.from(this.hosts.keys()).find((id): id is number => typeof id === 'number') ?? null
  }

  register = (id: HostId, manager: PortalManagerContextValue) => {
    this.hosts.set(id, manager)
    this.portals.forEach((item, key) => {
      // 没有页面时发起的请求只交给第一个注册的页面。
      if (item.id === null && typeof id === 'number') {
        item.id = id
        item.onBind?.(id)
      }
      if (item.id === id) manager.mount(key, item.children)
    })
    return () => {
      if (this.hosts.get(id) !== manager) return
      this.hosts.delete(id)
      this.portals.forEach((item, key) => {
        if (item.id === id) this.portals.delete(key)
      })
    }
  }
}
/**
 * portal
 */
export const portal = new PortalGuard()

const PortalHost = ({ children, id } :PortalHostProps): JSX.Element => {
  const manager = useRef<PortalManagerContextValue | null>(null)
  // id 在本次 Host 挂载期间保持不变。
  const hostId = useMemo(() => id ?? Symbol('portal-host'), [])
  useEffect(() => {
    if (manager.current) return portal.register(hostId, manager.current)
  }, [])
  return (
    <PortalContext.Provider
      value={{
        mount: (children) => portal.add(children, hostId),
        update: portal.update,
        unmount: portal.remove
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
