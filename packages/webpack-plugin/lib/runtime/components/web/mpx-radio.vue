<script>
  import getInnerListeners from './getInnerListeners'

  export default {
    name: 'mpx-radio',
    props: {
      value: {
        type: String,
        default: ''
      },
      disabled: Boolean,
      checked: Boolean,
      color: {
        type: String,
        default: '#09BB07'
      }
    },
    render (createElement) {
      const mergeAfter = {
        listeners: {
          change: () => {
            if (this.group) {
              this.group.notifyChange(this.value)
            }
          }
        },
        force: true
      }

      const domProps = {
        value: this.value,
        type: 'radio',
        checked: this.checked,
        disabled: this.disabled
      }


      const data = {
        class: 'mpx-radio',
        on: getInnerListeners(this, { mergeAfter }),
        domProps
      }
      return createElement('input', data, this.$slots.default)
    }
  }
</script>

<style lang="stylus">
  .mpx-radio
    margin 3px 3px 3px 4px
</style>
