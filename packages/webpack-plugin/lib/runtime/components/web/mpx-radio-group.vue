<script>
  import getInnerListeners, { getCustomEvent } from '@mpxjs/webpack-plugin/lib/runtime/components/web/getInnerListeners'

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
    name: 'mpx-radio-group',
    props: {
      name: String,
      value: {
        type: String,
        default: ''
      }
    },
    render (createElement) {
      const data = {
        class: 'mpx-radio-group',
        on: getInnerListeners(this),
      }
      return createElement('div', data, this.$slots.default)
    },
    mounted () {
      // 为了建立正确的绑定关系，初始时无论有没有value都需要遍历一次slot
      if (this.value) {
        this.setValue(this.value)
      } else {
        this.getValue()
      }
    },
    methods: {
      getValue () {
        let value = ''
        travelSlot(this.$slots.default, (VNode) => {
          if (VNode.tag && VNode.tag.endsWith('mpx-radio')) {
            const el = VNode.elm
            const component = VNode.componentInstance
            if (component) {
              if (!component.group) {
                component.group = this
              }
              if (component.group === this && el && el.checked && el.value) {
                value = el.value
              }
            }
          }
        })
        return value
      },
      setValue (value) {
        travelSlot(this.$slots.default, (VNode) => {
          if (VNode.tag && VNode.tag.endsWith('mpx-radio')) {
            const el = VNode.elm
            const component = VNode.componentInstance
            if (component) {
              if (!component.group) {
                component.group = this
              }
              if (component.group === this && el && el.value) {
                el.checked = value === el.value
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
        this.$emit('change', getCustomEvent('change', { value }))
      }
    }
  }
</script>
