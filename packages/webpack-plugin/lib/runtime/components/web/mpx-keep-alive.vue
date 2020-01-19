<script>
  function pruneCacheEntry (
    cache,
    keys,
    count = 1
  ) {
    for (let i = keys.length - 1; --count >= 0 && i >= 0; i--) {
      const key = keys[i]
      const cached = cache[key]
      if (cached) {
        cached.componentInstance.$destroy()
      }
      delete cache[key]
      remove(keys, key)
    }
  }

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

  export default {
    name: 'keep-alive',
    abstract: true,
    created: function created () {
      this.cache = {}
      this.keys = []
    },
    destroyed: function destroyed () {
      pruneCacheEntry(cache, keys, keys.length)
    },
    render: function render () {
      // console.log('keep-alive')
      const slot = this.$slots.default
      const vnode = getFirstComponentChild(slot)
      const componentOptions = vnode && vnode.componentOptions
      const router = window.__mpxRouter
      if (componentOptions && router && vnode.data.routerView) {
        const cache = this.cache
        const keys = this.keys
        const key = vnode.key == null
          ? componentOptions.Ctor.cid + (componentOptions.tag ? ('::' + (componentOptions.tag)) : '')
          : vnode.key
        if (router.__mpxAction) {
          switch (router.__mpxAction.type) {
            case 'replace':
              pruneCacheEntry(cache, keys)
              break
            case 'reLaunch':
              pruneCacheEntry(cache, keys, keys.length)
              break
            case 'back':
              pruneCacheEntry(cache, keys, router.__mpxAction.delta)
              break
          }
          router.__mpxAction = null
        } else {
          // 没有action发生变更且历史栈长度未增加时，为用户点击后退
          if (window.history.length === router.__mpxHistoryLength) {
            pruneCacheEntry(cache, keys)
          }
        }
        router.__mpxHistoryLength = window.history.length

        if (cache[key]) {
          vnode.componentInstance = cache[key].componentInstance
          // make current key freshest
          remove(keys, key)
          keys.push(key)
        } else {
          cache[key] = vnode
          keys.push(key)
        }

        vnode.data.keepAlive = true
      }
      return vnode || (slot && slot[0])
    }
  }
</script>


