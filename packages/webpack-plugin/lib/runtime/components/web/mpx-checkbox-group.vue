<script>
  import getInnerListeners, { getCustomEvent } from './getInnerListeners'

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
      name: String
    },
    data () {
      return {
        value: []
      }
    },
    render (createElement) {
      const data = {
        class: 'mpx-checkbox-group',
        on: getInnerListeners(this, { ignoredListeners: ['change'] })
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
              if (component.group === this && component.isChecked && component.value) {
                value.push(component.value)
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
              if (component.group === this && component.value) {
                component.isChecked = value.indexOf(component.isChecked) !== -1
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
        this.$emit('change', getCustomEvent('change', { value: value }))
      }
    }
  }
</script>
