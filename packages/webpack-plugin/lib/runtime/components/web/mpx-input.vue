<script>
  import getInnerListeners, {
    extendEvent,
    getCustomEvent
  } from '@mpxjs/webpack-plugin/lib/runtime/components/web/getInnerListeners'

  export default {
    name: 'mpx-input',
    props: {
      name: String,
      value: {
        type: String,
        default: ''
      },
      type: {
        type: String,
        default: 'text'
      },
      password: Boolean,
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
      const attrs = {
        name: this.name,
        value: this.value,
        type: this.password ? 'password' : this.type,
        placeholder: this.placeholder,
        disabled: this.disabled,
        autofocus: this.focus || this.autoFocus
      }

      if (this.maxlength !== -1) {
        attrs.maxlength = this.maxlength
      }

      const data = {
        class: 'mpx-input',
        on: getInnerListeners(this, { mergeBefore }),
        attrs,
        ref: 'input'
      }
      return createElement('input', data, this.$slots.default)
    },
    methods: {
      getValue () {
        return this.$refs.input.value
      },
      setValue (value) {
        this.$refs.input.value = value
      },
      notifyChange (value) {
        if (value!==undefined) {
          this.setValue(value)
        }
        // 通过原生input派发事件
        this.$refs.input.dispatchEvent(getCustomEvent('input'))
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
              this.$refs.input.setSelectionRange(this.__selectionRange.start, this.__selectionRange.end)
            }
          })
        }
      }
    }
  }
</script>
