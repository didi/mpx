import { CREATED, BEFORECREATE, BEFOREUPDATE, UNMOUNTED } from '../../core/innerLifecycle'
import { noop, error, getEnvObj } from '@mpxjs/utils'

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
    },
    [BEFOREUPDATE] () {
      this.__refCacheMap.clear()
      this.__asyncRefCacheMap.clear()
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
      }
    }
  }

  if (__mpx_mode__ === 'ali') {
    Object.assign(refsMixin, {
      data () {
        return {
          mpxCid: this.__mpxProxy.uid
        }
      },
      [CREATED] () {
        this.__updateRef()
      },
      [UNMOUNTED] () {
        // 销毁ref
        this.__updateRef(true)
      }
    })

    const proxyMethods = ['boundingClientRect', 'scrollOffset']

    Object.assign(refsMixin.methods, {
      // todo 支付宝基础库升级至2.7.4以上可去除
      createSelectorQuery (...args) {
        const selectorQuery = envObj.createSelectorQuery(...args)
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
      // todo 支付宝基础库升级至2.7.4以上可去除
      createIntersectionObserver (...args) {
        return envObj.createIntersectionObserver(...args)
      },
      selectComponent (selector, all) {
        const children = this.__children__ || []
        const result = []
        for (const child of children) {
          if (child.identifiers.indexOf(selector) > -1) {
            result.push(child.component)
            if (!all) {
              break
            }
          }
        }
        if (selector.lastIndexOf('.') > 0) {
          const location = this.__mpxProxy.options.mpxFileResource
          error('The selectComponent or selectAllComponents only supports the single selector, a composed selector is not supported.', location)
        }
        return all ? result : result[0]
      },
      selectAllComponents (selector) {
        return this.selectComponent(selector, true)
      },
      __updateRef (destroyed) {
        this.triggerEvent && this.triggerEvent('updateRef', {
          component: this,
          destroyed
        })
      },
      __handleUpdateRef (e) {
        if (!this.__children__) {
          this.__children__ = []
        }
        const component = e.detail.component
        const destroyed = e.detail.destroyed
        const className = component.props.className || component.className
        const identifiers = className
          ? className.trim().split(/\s+/).map(item => {
            return `.${item}`
          })
          : []
        if (component.props.id) {
          identifiers.push(`#${component.props.id}`)
        }
        if (destroyed) {
          this.__children__ = this.__children__.filter(item => item.component !== component)
        } else {
          this.__children__.push({
            component,
            identifiers
          })
        }
      }
    })
  }

  return refsMixin
}
