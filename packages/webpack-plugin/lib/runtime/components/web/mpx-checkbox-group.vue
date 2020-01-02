<script>
  import getInnerListeners from '@mpxjs/webpack-plugin/lib/runtime/components/web/getInnerListeners'

  function travelSlot (slot, effect) {
    if (slot) {
      slot.forEach((VNode) => {
        effect && effect(VNode)
        if (VNode.children) {
          travelSlot(VNode.children, effect)
        }
      })
    }
  }

  export default {
    name: 'mpx-checkbox-group',
    props: {
      name: String,
      value: {
        type: Array,
        default () {
          return []
        }
      }
    },
    render (createElement) {
      const data = {
        class: 'mpx-checkbox-group',
        on: getInnerListeners(this),
      }
      return createElement('div', data, this.$slots.default)
    },
    mounted () {
      // 为了建立正确的绑定关系，初始时无论有没有value都需要遍历一次slot
      if (this.value.length) {
        this.setValue(this.value)
      } else {
        this.getValue()
      }
    },
    methods: {
      getValue () {
        const value = []
        travelSlot(this.$slots.default, (VNode) => {
          if (VNode.tag && VNode.tag.endsWith('mpx-checkbox')) {
            const el = VNode.elm
            const component = VNode.componentInstance
            if (component) {
              if (!component.group) {
                component.group = this
              }
              if (component.group === this && el && el.checked && el.value) {
                value.push(el.value)
              }
            }
          }
        })
        return value
      },
      setValue (value) {
        travelSlot(this.$slots.default, (VNode) => {
          if (VNode.tag && VNode.tag.endsWith('mpx-checkbox')) {
            const el = VNode.elm
            const component = VNode.componentInstance
            if (component) {
              if (!component.group) {
                component.group = this
              }
              if (component.group === this && el && el.value) {
                el.checked = value.indexOf(el.value) !== -1
              }
            }
          }
        })
      },
      notifyChange (value) {
        if (value !== undefined) {
          this.setValue(value)
        } else {
          value = this.getValue()
        }
        this.$emit('change', {
          type: 'change',
          detail: {
            value: value
          },
          timeStamp: +new Date()
        })
      }
    }
  }
</script>
