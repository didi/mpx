import { BEFORECREATE, CREATED, BEFOREMOUNT, UPDATED, DESTROYED } from '../../core/innerLifecycle'
import { is } from '../../helper/env'
import { noop } from '../../helper/utils'

export default function getRefsMixin () {
  let aliMethods
  if (is('ali')) {
    const proxyMethods = ['boundingClientRect', 'scrollOffset']

    aliMethods = {
      createSelectorQuery (...rest) {
        const selectorQuery = my.createSelectorQuery(...rest)
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
              cbs[index](item)
            })
            originalCb(results)
          }
          return originalExec.call(this, cb)
        }
        return selectorQuery
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
          console.error('the selectComponent or selectAllComponents only supports the single selector, so the compound selector may be failed')
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
        const className = component.mpxClass || component.className
        const identifiers = className ? className.trim().split(/\s+/).map(item => {
          return `.${item}`
        }) : []
        if (component.id) {
          identifiers.push(`#${component.id}`)
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
    }
  }
  return {
    [BEFORECREATE] () {
      this.$refs = {}
    },
    [CREATED] () {
      this.__updateRef && this.__updateRef()
    },
    [BEFOREMOUNT] () {
      this.__getRefs()
    },
    [UPDATED] () {
      this.__getRefs()
    },
    [DESTROYED] () {
      // 销毁ref
      this.__updateRef && this.__updateRef(true)
    },
    methods: {
      ...aliMethods,
      __getRefs () {
        if (this.__getRefsData) {
          const refs = this.__getRefsData()
          refs.forEach(ref => {
            this.$refs[ref.key] = this.__getRefNode(ref)
          })
        }
      },
      __getRefNode (ref) {
        if (!ref) return
        let selector = ref.selector.replace(/{{mpxCid}}/g, this.$mpxProxy.uid)
        if (ref.type === 'node') {
          const query = this.createSelectorQuery()
          return query && (ref.all ? query.selectAll(selector) : query.select(selector))
        } else if (ref.type === 'component') {
          return ref.all ? this.selectAllComponents(selector) : this.selectComponent(selector)
        }
      }
    }
  }
}
