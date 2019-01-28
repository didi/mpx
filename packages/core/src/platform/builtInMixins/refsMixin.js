import { MOUNTED, UPDATED, DESTROYED } from '../../core/innerLifecycle'
import { is } from '../../helper/env'

export default function getRefsMixin () {
  let aliMethods
  if (is('ali')) {
    aliMethods = {
      __updateRef (destroyed) {
        this.triggerEvent('updateRef', {
          component: this,
          destroyed
        })
      },
      __handleUpdateRef (ref, e) {
        if (!this.$componentRefs) {
          this.$componentRefs = {}
        }
        const component = e.detail.component
        const destroyed = e.detail.destroyed
        let refs = this.$componentRefs[ref.key]
        if (ref.all) {
          if (refs) {
            if (destroyed) {
              const index = refs.indexOf(component)
              index > -1 && refs.splice(index, 1)
            } else {
              refs.push(component)
            }
          } else {
            !destroyed && (refs = [component])
          }
        } else {
          destroyed ? (refs = null) : (refs = component)
        }
        this.$componentRefs[ref.key] = refs
        this.$refs && (this.$refs[ref.key] = refs)
      }
    }
  }
  return {
    [MOUNTED] () {
      this.$refs = {}
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
          if (is('wx')) {
            query = wx.createSelectorQuery().in(this)
          } else if (is('ali')) {
            query = my.createSelectorQuery()
          }
          return query && (ref.all ? query.selectAll(ref.selector) : query.select(ref.selector))
        } else if (ref.type === 'component') {
          if (is('wx')) {
            return ref.all ? this.selectAllComponents(ref.selector) : this.selectComponent(ref.selector)
          } else if (is('ali')) {
            return this.$componentRefs ? this.$componentRefs[ref.key] : null
          }
        }
      }
    }
  }
}
