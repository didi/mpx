import { BEFORECREATE, BEFOREMOUNT, UPDATED, DESTROYED } from '../../core/innerLifecycle'
import { is } from '../../helper/env'

export default function getRefsMixin () {
  let aliMethods
  if (is('ali')) {
    aliMethods = {
      selectComponent (selector, all) {
        const children = this.__children__ || []
        const result = []
        for (const child of children) {
          if (child.cid.indexOf(selector) > -1) {
            result.push(child.component)
            if (!all) {
              break
            }
          }
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
        let cid = '.' + component.mpxClass.trim().replace(/\s+/g, '.')
        const id = component.id
        if (id) {
          cid += `#${id}`
        }
        if (destroyed) {
          this.__children__ = this.__children__.filter(item => item.component !== component)
        } else {
          this.__children__.push({
            component,
            cid
          })
        }
      }
    }
  }
  return {
    [BEFORECREATE] () {
      this.$refs = {}
    },
    [BEFOREMOUNT] () {
      this.__getRefs()
      this.__updateRef && this.__updateRef()
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
        if (ref.type === 'node') {
          let query
          if (is('ali')) {
            query = my.createSelectorQuery()
          } else {
            query = this.createSelectorQuery()
          }
          return query && (ref.all ? query.selectAll(ref.selector) : query.select(ref.selector))
        } else if (ref.type === 'component') {
          return ref.all ? this.selectAllComponents(ref.selector) : this.selectComponent(ref.selector)
        }
      }
    }
  }
}
