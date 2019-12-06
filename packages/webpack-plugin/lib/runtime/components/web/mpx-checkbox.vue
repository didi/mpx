<script>
  import getInnerListeners from '@mpxjs/webpack-plugin/lib/runtime/components/web/getInnerListeners'

  export default {
    name: 'mpx-checkbox',
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
              this.group.notifyChange()
            }
          }
        },
        force: true
      }

      const attrs = {
        value: this.value,
        type: 'checkbox',
        checked: this.checked,
        disabled: this.disabled
      }


      const data = {
        class: 'mpx-checkbox',
        on: getInnerListeners(this, { mergeAfter }),
        attrs
      }
      return createElement('input', data, this.$slots.default)
    }
  }
</script>

<style lang="stylus">
  .mpx-checkbox
    margin 3px 3px 3px 4px
</style>
