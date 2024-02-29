<script>
  import { isBrowser } from '../../env'

  function isDef (v) {
    return v !== undefined && v !== null
  }

  function remove (arr, item) {
    if (arr.length) {
      const index = arr.indexOf(item)
      if (index > -1) {
        return arr.splice(index, 1)
      }
    }
  }

  function isAsyncPlaceholder (node) {
    return node.isComment && node.asyncFactory
  }

  function getFirstComponentChild (children) {
    if (Array.isArray(children)) {
      for (let i = 0; i < children.length; i++) {
        const c = children[i]
        if (isDef(c) && (isDef(c.componentOptions) || isAsyncPlaceholder(c))) {
          return c
        }
      }
    }
  }

  function getVnodeKey (vnode) {
    return vnode.tag + (vnode.key ? `::${vnode.key}` : '')
  }

  export default {
    name: 'mpx-keep-alive',
    abstract: true,
    render: function render () {
      const slot = this.$slots.default
      const vnode = getFirstComponentChild(slot)
      if (!isBrowser || !vnode) {
        return vnode || (slot && slot[0])
      }
      const router = global.__mpxRouter
      if (router) {
        // 存在routeCount的情况下修改vnode.key避免patch时复用旧节点实例
        if (router.currentRoute.query.routeCount) vnode.key = router.currentRoute.query.routeCount
        const vnodeKey = getVnodeKey(vnode)
        if (router.needCache) {
          router.needCache.vnode = vnode
          router.needCache = null
        }

        router.needRemove.forEach((removeItem) => {
          if (
            removeItem.vnode &&
            removeItem.vnode.componentInstance &&
            !removeItem.vnode.componentInstance._isDestroyed &&
            router.stack.every((item) => {
              return !(item.vnode && item.vnode.componentInstance === removeItem.vnode.componentInstance)
            })
          ) {
            removeItem.vnode.componentInstance.$destroy()
          }
        })
        // 在执行完destroy后再同步lastStack信息，让用户在destroy钩子中还能够访问到销毁之前的页面栈，与小程序保持一致
        router.lastStack = router.stack.slice()
        router.needRemove.length = 0

        const stack = router.stack
        if (stack.length) {
          // 只要历史栈缓存中存在对应的页面存活实例且vnodeKey相同，就进行复用
          for (let i = stack.length; i > 0; i--) {
            const current = stack[i - 1]
            if (current.vnode && getVnodeKey(current.vnode) === vnodeKey && current.vnode.componentInstance) {
              vnode.componentInstance = current.vnode.componentInstance
              break
            }
          }
        }

        if (router.__mpxAction) router.__mpxAction = null
        vnode.data.keepAlive = true
      }

      router.__mpxActiveVnode = vnode
      return vnode || (slot && slot[0])
    }
  }
</script>


