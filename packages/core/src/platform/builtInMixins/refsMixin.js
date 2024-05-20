import { CREATED, BEFORECREATE, BEFOREUPDATE } from '../../core/innerLifecycle'
import { noop, getEnvObj } from '@mpxjs/utils'
import contextMap from '../../vnode/context'

const envObj = getEnvObj()

const setNodeRef = function (target, ref) {
  Object.defineProperty(target.$refs, ref.key, {
    enumerable: true,
    configurable: true,
    get () {
      // for nodes, every time being accessed, returns as a new selector.
      return target.__getRefNode(ref)
    }
  })
}

const setComponentRef = function (target, ref, isAsync) {
  const targetRefs = isAsync ? target.$asyncRefs : target.$refs
  const cacheMap = isAsync ? target.__asyncRefCacheMap : target.__refCacheMap
  const key = ref.key
  Object.defineProperty(targetRefs, key, {
    enumerable: true,
    configurable: true,
    get () {
      // wx由于分包异步化的存在，每次访问refs都需要重新执行selectComponent，避免一直拿到缓存中的placeholder
      if (__mpx_mode__ === 'wx' || !cacheMap.get(key)) {
        cacheMap.set(key, target.__getRefNode(ref, isAsync))
      }
      return cacheMap.get(key)
    }
  })
}

export default function getRefsMixin () {
  const refsMixin = {
    [BEFORECREATE] () {
      this.$refs = {}
      this.$asyncRefs = {}
      this.__refCacheMap = new Map()
      this.__asyncRefCacheMap = new Map()
      this.__getRefs()

      if (__mpx_mode__ === 'ali') {
        this._originCreateSelectorQuery = this.createSelectorQuery
        this.createSelectorQuery = this._createSelectorQuery
      }
    },
    [BEFOREUPDATE] () {
      this.__refCacheMap.clear()
      this.__asyncRefCacheMap.clear()
    },
    [CREATED] () {
      // todo 需要确认下这部分的逻辑，如果是在 beforeCreate 钩子里面执行，部分数据取不到
      // 如果是在运行时组件的上下文渲染
      if (this.mpxCustomElement) {
        this.__getRuntimeRefs()
      }
    },
    methods: {
      __getRefs () {
        if (this.__getRefsData) {
          const refs = this.__getRefsData()
          refs.forEach(ref => {
            const setRef = ref.type === 'node' ? setNodeRef : setComponentRef
            setRef(this, ref)
            if (__mpx_mode__ === 'tt' && ref.type === 'component') {
              setComponentRef(this, ref, true)
            }
          })
        }
      },
      __getRefNode (ref, isAsync) {
        if (!ref) return
        const selector = ref.selector.replace(/{{mpxCid}}/g, this.__mpxProxy.uid)
        if (ref.type === 'node') {
          const query = this.createSelectorQuery ? this.createSelectorQuery() : envObj.createSelectorQuery()
          return query && (ref.all ? query.selectAll(selector) : query.select(selector))
        } else if (ref.type === 'component') {
          if (isAsync) {
            return new Promise((resolve) => {
              ref.all ? this.selectAllComponents(selector, resolve) : this.selectComponent(selector, resolve)
            })
          } else {
            return ref.all ? this.selectAllComponents(selector) : this.selectComponent(selector)
          }
        }
      },
      __getRuntimeRefs () {
        const vnodeContext = contextMap.get(this.uid)
        if (vnodeContext) {
          const refsArr = vnodeContext.__getRefsData && vnodeContext.__getRefsData()
          if (Array.isArray(refsArr)) {
            refsArr.forEach((ref) => {
              const all = ref.all
              if (!vnodeContext.$refs[ref.key] || (all && !vnodeContext.$refs[ref.key].length)) {
                const refNode = this.__getRefNode(ref)
                if ((all && refNode.length) || refNode) {
                  Object.defineProperty(vnodeContext.$refs, ref.key, {
                    enumerable: true,
                    configurable: true,
                    get: () => {
                      return refNode
                    }
                  })
                }
              }
            })
          }
        }
      }
    }
  }

  if (__mpx_mode__ === 'ali') {
    Object.assign(refsMixin, {
      data () {
        return {
          mpxCid: this.__mpxProxy.uid
        }
      }
    })

    const proxyMethods = ['boundingClientRect', 'scrollOffset']

    Object.assign(refsMixin.methods, {
      _createSelectorQuery (...args) {
        const selectorQuery = this._originCreateSelectorQuery(...args)
        const cbs = []

        proxyMethods.forEach((name) => {
          const originalMethod = selectorQuery[name]
          selectorQuery[name] = function (cb = noop) {
            cbs.push(cb)
            return originalMethod.call(this)
          }
        })

        const originalExec = selectorQuery.exec
        selectorQuery.exec = function (originalCb = noop) {
          const cb = function (results) {
            results.forEach((item, index) => {
              cbs[index] && cbs[index](item)
            })
            originalCb(results)
          }
          return originalExec.call(this, cb)
        }

        return selectorQuery
      },
      selectComponent (selector) {
        return this.$selectComponent(selector)
      },
      selectAllComponents (selector) {
        return this.$selectAllComponents(selector)
      }
    })
  }

  return refsMixin
}
