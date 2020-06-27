<script>
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
    if (vnode && vnode.componentOptions) {
      return vnode.key || vnode.componentOptions.Ctor.cid + (vnode.componentOptions.tag ? ('::' + (vnode.componentOptions.tag)) : '')
    }
  }

  export default {
    name: 'mpx-keep-alive',
    abstract: true,
    render: function render () {
      const slot = this.$slots.default
      const vnode = getFirstComponentChild(slot)
      const vnodeKey = getVnodeKey(vnode)
      const router = window.__mpxRouter
      if (vnodeKey && router && vnode.data.routerView) {
        if (router.needCache) {
          router.needCache.vnode = vnode
          router.needCache.vnodeKey = vnodeKey
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
        router.needRemove.length = 0

        const stack = router.stack
        if (stack.length) {
          const current = stack[stack.length - 1]
          if (current.vnode && current.vnodeKey === vnodeKey && current.vnode.componentInstance) {
            vnode.componentInstance = current.vnode.componentInstance
          }
        }

        if (router.__mpxAction) {
          if (router.__mpxAction.type === 'reLaunch') {
            // reLaunch时修改新vnode的key, 确保任何情况下都新创建组件实例
            vnode.key = (vnode.key || '') + router.__mpxAction.reLaunchCount
          }
          router.__mpxAction = null
        }
        vnode.data.keepAlive = true
      }

      router.__mpxActiveVnode = vnode
      return vnode || (slot && slot[0])
    }
  }
</script>


