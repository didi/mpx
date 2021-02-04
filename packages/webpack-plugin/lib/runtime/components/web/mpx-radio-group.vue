<script>
  import getInnerListeners, { getCustomEvent } from './getInnerListeners'

  function travelSlot (slot, effect) {
    if (slot) {
      slot.forEach((VNode) => {
        const el = VNode.elm
        const component = VNode.componentInstance
        // component.isChecked = false
        effect && effect(VNode)
        if (VNode.children) {
          travelSlot(VNode.children, effect)
        }
        // if (VNode.elm && VNode.elm.className && VNode.elm.className.indexOf('mpx-radio') > -1) {
        //   VNode.elm.className = 'mpx-radio'
        // }
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
        on: getInnerListeners(this, { ignoredListeners: ['change'] })
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
              if (component.group === this && component.isChecked && component.value) {
                value = component.value
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
              if (component.group === this && component.value) {
                component.isChecked = false
              }
            }
          }
        })
      },
      notifyChange (value, vm) {
        if (value !== undefined) {
          this.setValue(value)
        } else {
          value = this.getValue()
        }
        if (vm && vm.isChecked !== undefined) {
          vm.isChecked = true
        }
        this.$emit('change', getCustomEvent('change', { value }))
      }
    }
  }
</script>
