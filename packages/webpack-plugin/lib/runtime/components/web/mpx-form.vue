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

  function getFormValue (slot, effect) {
    const value = {}
    travelSlot(slot, (VNode) => {
      effect && effect(VNode)
      if (VNode.tag) {
        const el = VNode.elm
        const component = VNode.componentInstance
        if (component && component.name && component.getValue) {
          value[component.name] = component.getValue()
        } else if (el && el.name && el.value !== undefined) {
          value[el.name] = el.value
        }
      }
    })
    return value
  }
  function setEmptyValue (value) {
    if (typeof value === 'string') {
      return ''
    } else if (typeof value === 'number') {
      return 0
    } else if (Array.isArray(value)) {
      return []
    }
  }

  function setFormValue (slot, value) {
    travelSlot(slot, (VNode) => {
      if (VNode.tag) {
        const el = VNode.elm
        const component = VNode.componentInstance
        if (component && component.name && component.setValue) {
          component.setValue(setEmptyValue(value[component.name]))
        } else if (el && el.name && el.value !== undefined) {
          el.value = setEmptyValue(value[el.name])
        }
      }
    })
  }

  export default {
    name: 'mpx-form',
    render (createElement) {
      const data = {
        class: 'mpx-form',
        on: getInnerListeners(this, { ignoredListeners: ['submit', 'reset'] }),
      }
      return createElement('form', data, this.$slots.default)
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
        this.$emit('submit', getCustomEvent('submit', { value }, this))
      },
      reset () {
        setFormValue(this.$slots.default, this.initialValue)
        this.$emit('reset', getCustomEvent('reset', { value: this.initialValue }, this))
      }
    }
  }
</script>
