import { MOUNTED, UPDATED, DESTROYED } from '../../core/innerLifecycle'
import { is } from '../../helper/env'
export default function getRefsMixin () {
  let aliMethods
  if (is('ali')) {
    aliMethods = {
      __setRefToParent (destroyed) {
        const selfRef = this.__getSelfRefData && this.__getSelfRefData()
        if (selfRef && this.onPassComponentToParent) {
          this.onPassComponentToParent({
            key: selfRef.key,
            all: selfRef.all,
            component: this,
            destroyed
          })
        }
      },
      __getaliChildComponent (ref) {
        if (!this.$componentRefs) {
          this.$componentRefs = {}
        }
        let refs = this.$componentRefs[ref.key]
        if (ref.all) {
          if (refs) {
            if (ref.destroyed) {
              const index = refs.indexOf(ref.component)
              index > -1 && refs.splice(index, 1)
            } else {
              refs.push(ref.component)
            }
          } else {
            !ref.destroyed && (refs = [ref.component])
          }
        } else {
          ref.destroyed ? (refs = null) : (refs = ref.component)
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
      this.__setRefToParent && this.__setRefToParent()
    },
    [UPDATED] () {
      this.__getRefs()
    },
    [DESTROYED] () {
      // 销毁ref
      this.__setRefToParent && this.__setRefToParent(true)
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
