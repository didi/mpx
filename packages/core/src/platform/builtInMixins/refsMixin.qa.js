import { BEFORECREATE, CREATED, BEFOREMOUNT, UPDATED, DESTROYED } from '../../core/innerLifecycle'
import { noop } from '../../helper/utils'
import { error } from '../../helper/log'

export default function getRefsMixin (type) {
  
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
      let selector = ref.selector.replace(/{{mpxCid}}/g, this.__mpxProxy.uid)
      // if (ref.type === 'node') {
      //   const query = this.createSelectorQuery()
      //   return query && (ref.all ? query.selectAll(selector) : query.select(selector))
      // } else if (ref.type === 'component') {
      //   return ref.all ? this.selectAllComponents(selector) : this.selectComponent(selector)
      // }
    }
  }
}
