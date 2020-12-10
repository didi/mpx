import { BEFORECREATE, CREATED, BEFOREMOUNT, UPDATED, DESTROYED } from '../../core/innerLifecycle'
import { noop } from '../../helper/utils'
import { error } from '../../helper/log'

export default function getRefsMixin (type) {
  return {
    [BEFORECREATE] () {
      this.$refs = {}
    },
    [CREATED] () {
      // 子component的ref收集
      this.__updateRef && this.__updateRef(false)
      this.__collectRef()
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
    createSelectorQuery () {
      return {
        selectAll () {
          error('QuickApp not supports selectAll.')
          return []
        },
        select (selector) {
          let dom = this.$element(selector)
          if (!dom) return null
          dom.cbs = []
          dom.boundingClientRect = (success = noop) => {
            dom.cbs.push(() => dom.getBoundingClientRect && dom.getBoundingClientRect({ success }))
            return dom
          }
          dom.scrollOffset = () => {
            dom.cbs.push(() => error('QuickApp not supports scrollOffset.'))
            return dom
          }
          dom.exec = () => {
            dom.cbs.forEach(item => item())
            dom.cbs = []
            return dom
          }
          return dom
        }
      }
    },
    selectComponent (selector, all) {
      const children = this.__children__ || []
      const result = []
      for (const child of children) {
        if (child.identifier === selector) {
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
    __collectRef () {
      // 监听更新ref的事件
      this.$on('updateRef', e => {
        e.stop()
        const { component, destroyed } = e.detail
        const identifier = component._attrs.id
        if (destroyed) {
          this.__children__ = this.__children__.filter(item => item.component !== component)
        } else if (identifier) {
          const child = {
            component,
            identifier
          }
          this.__children__.push(child)
        }
      })
    },
    __updateRef (destroyed) {
      if (!this.__children__) {
        this.__children__ = []
      }
      this.$dispatch('updateRef', {
        component: this,
        destroyed
      })
    },
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
      let selector = ref.selector.replace(/\./g, '')

      if (ref.type === 'node') {
        const query = this.createSelectorQuery()
        return query && (ref.all ? query.selectAll.call(this, selector) : query.select.call(this, selector))
      } else if (ref.type === 'component') {
        return ref.all ? this.selectAllComponents(selector) : this.selectComponent(selector)
      }
    }
  }
}
