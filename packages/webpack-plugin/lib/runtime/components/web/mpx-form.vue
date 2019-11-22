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

  function getFormValue (slot, effect) {
    const value = {}
    travelSlot(slot, (VNode) => {
      effect && effect(VNode)
      if (VNode.tag) {
        const el = VNode.elm
        const component = VNode.componentInstance
        if (el && el.name && el.value !== undefined) {
          value[el.name] = el.value
        } else if (component && component.name && component.value !== undefined) {
          value[component.name] = component.value
        }
      }
    })
    return value
  }

  function setFormValue (slot, value) {
    travelSlot(slot, (VNode) => {
      if (VNode.tag) {
        const el = VNode.elm
        const component = VNode.componentInstance
        if (el && el.name && el.value !== undefined) {
          el.value = value[el.name]
        } else if (component && component.name && component.value !== undefined) {
          component.value = value[component.name]
        }
        if (component && component.notifyChange) {
          component.notifyChange()
        }
      }
    })
  }

  export default {
    name: 'mpx-form',
    render (createElement) {
      const data = {
        class: 'mpx-form',
        on: getInnerListeners(this),
      }
      return createElement('div', data, this.$slots.default)
    },
    mounted () {
      this.initialValue = getFormValue(this.$slots.default, (VNode) => {
        if (VNode.tag && VNode.tag.endsWith('mpx-button')) {
          const component = VNode.componentInstance
          if (component && component.formType) {
            if (!component.form) {
              component.form = this
            }
          }
        }
      })
    },
    methods: {
      submit () {
        const value = getFormValue(this.$slots.default)
        this.$emit('submit', {
          detail: {
            value
          },
          formId: ''
        })
      },
      reset () {
        setFormValue(this.$slots.default, this.initialValue)
        this.$emit('reset', {
          detail: {
            value: this.initialValue
          },
          formId: ''
        })
      }
    }
  }
</script>
