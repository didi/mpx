import { MOUNTED, UPDATED } from '../../core/innerLifecycle'
import { type } from '../../helper/utils'
import { is } from '../../helper/env'
export default function getRefsMixin () {
  return {
    [MOUNTED] () {
      this.__getRefs()
    },
    [UPDATED] () {
      this.__getRefs()
    },
    methods: {
      __getRefs () {
        if (this.__getRefsData) {
          const refs = this.__getRefsData()
          this.$refs = {}
          refs.forEach(ref => {
            const oldNode = this.$refs[ref.key]
            const newNode = this.__getRefNode(ref)
            if (oldNode) {
              this.$refs[ref.key] = type(oldNode) === 'Array' ? oldNode.concat([newNode]) : [oldNode, newNode]
            } else {
              this.$refs[ref.key] = newNode
            }
          })
        }
      },
      __getRefNode (ref) {
        if (ref.type === 'node') {
          let query
          if (is('wx')) {
            query = wx.createSelectorQuery().in(this)
          } else if (is('ant')) {
            query = my.createSelectorQuery()
          }
          return query && query.select(ref.selector)
        } else if (ref.type === 'component') {
          if (is('wx')) {
            return this.selectComponent(ref.selector)
          }
        }
      }
    }
  }
}
