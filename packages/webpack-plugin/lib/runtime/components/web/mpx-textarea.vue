<script>
  import getInnerListeners, {
    extendEvent,
    getCustomEvent
  } from './getInnerListeners'

  export default {
    name: 'mpx-textarea',
    props: {
      name: String,
      value: {
        type: String,
        default: ''
      },
      placeholder: String,
      disabled: Boolean,
      maxlength: {
        type: Number,
        default: 140
      },
      autoFocus: Boolean,
      focus: Boolean,
      cursor: {
        type: Number,
        default: -1
      },
      selectionStart: {
        type: Number,
        default: -1
      },
      selectionEnd: {
        type: Number,
        default: -1
      }
    },
    watch: {
      cursor: {
        handler (val) {
          if (val !== -1) this.setSelectionRange(val, val)
        },
        immediate: true
      },
      selectionStart: {
        handler (val) {
          if (val !== -1) this.setSelectionRange(val)
        },
        immediate: true
      },
      selectionEnd: {
        handler (val) {
          if (val !== -1) this.setSelectionRange(undefined, val)
        },
        immediate: true
      }
    },
    render (createElement) {
      const mergeBefore = {
        input (e) {
          extendEvent(e, {
            detail: {
              value: e.target.value
            }
          })
        },
        focus (e) {
          extendEvent(e, {
            detail: {
              value: e.target.value
            }
          })
        },
        blur (e) {
          extendEvent(e, {
            detail: {
              value: e.target.value
            }
          })
        }
      }
      const domProps = {
        name: this.name,
        value: this.value,
        placeholder: this.placeholder,
        disabled: this.disabled,
        autofocus: this.focus || this.autoFocus
      }

      if (this.maxlength !== -1) {
        domProps.maxLength = this.maxlength
      }

      const data = {
        class: 'mpx-textarea',
        on: getInnerListeners(this, { mergeBefore }),
        domProps,
        ref: 'textarea'
      }
      return createElement('textarea', data, this.$slots.default)
    },
    methods: {
      getValue () {
        return this.$refs.textarea.value
      },
      setValue (value) {
        this.$refs.textarea.value = value
      },
      notifyChange (value) {
        if (value !== undefined) {
          this.setValue(value)
        }
        // 通过原生input派发事件
        this.$refs.textarea.dispatchEvent(getCustomEvent('input'))
      },
      setSelectionRange (start, end) {
        if (!this.__selectionRange) this.__selectionRange = {
          start: -1,
          end: -1,
          setting: false
        }
        if (start !== undefined) this.__selectionRange.start = start
        if (end !== undefined) this.__selectionRange.end = end
        if (!this.__selectionRange.setting) {
          this.__selectionRange.setting = true
          this.$nextTick(() => {
            this.__selectionRange.setting = false
            if (this.__selectionRange.start !== -1 && this.__selectionRange.end !== -1) {
              this.$refs.textarea.setSelectionRange(this.__selectionRange.start, this.__selectionRange.end)
            }
          })
        }
      }
    }
  }
</script>

<style lang="stylus">
  .mpx-textarea
    font inherit
    cursor auto
    width 300px
    height 150px
    display block
    position relative
    resize none
    border: none
    outline: none
    background: transparent
</style>
