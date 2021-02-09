<script>
  import getInnerListeners, { extendEvent, getCustomEvent } from './getInnerListeners'


  export default {
    name: 'mpx-switch',
    props: {
      name: String,
      type: {
        type: String,
        default: 'switch'
      },
      checked: {
        type: Boolean,
        default: false
      },
      disabled: {
        type: Boolean,
        default: false
      },
      color: {
        type: String,
        default: '#04BE02'
      }
    },
    data () {
      return {
        switchChecked: this.checked
      }
    },
    render (createElement) {
      let children = []
      const domProps = {
        type: 'checkbox',
        checked: this.checked,
        disabled: this.disabled
      }

      const checkbox = createElement('input', {
        class: 'mpx-switch-input',
        on: {
          change: (e) => {
            this.switchChecked = e.target.checked
            extendEvent(e, {
              detail: {
                value: e.target.checked
              }
            })
          }
        },
        domProps
      })
      if (this.type === 'switch') {
        const switchElem = createElement('div', {
          class: ['mpx-switch-label', this.switchChecked ? 'checked-switch-label' : 'uncheck-switch-label'],
          style: this.switchChecked ? {
            borderColor: this.color,
            background: this.color
          } : {}
        })
        children.push(switchElem)
      } else {
        const style = global.__style === 'v2' ? 'v2' : 'v1'
        const checkbox = createElement('div', {
          class: ['mpx-switch-checkbox', this.switchChecked && 'mpx-switch-checkbox-checked-' + style]
        })

        children.push(checkbox)
      }
      children.push(checkbox)
      children.push(...(this.$slots.default || []))

      const data = {
        class: [this.type === 'switch' ? 'mpx-switch-wrap' : 'mpx-checkbox-wrap']
      }
      return createElement('div', data, children)
    },
    methods: {
      getValue () {
        return this.switchChecked
      },
      setValue (value) {
        this.switchChecked = value
      },
      notifyChange (value) {
        if (value !== undefined) {
          this.setValue(value)
        }
        this.$emit('change', getCustomEvent('change', { value: value }))
      }
    }
  }
</script>

<style lang="stylus">
  .mpx-checkbox-wrap
    display: inline-flex
    position: relative
  .mpx-switch-input
    position: absolute
    width: 100%
    height: 100%
    z-index: 2
    opacity: 0
  .mpx-switch-wrap
    display: inline-flex
    width: 52px
    height: 32px
    position: relative
    .mpx-switch-label
      width: 52px
      height: 32px
      border-radius: 16px
      border: 1px solid #DFDFDF
      &.checked-switch-label
        &:before
          transform: scale(0)
        &:after
          transform: translateX(18px)
      &:before
        content: " "
        position: absolute
        width: 50px
        height: 30px
        border-radius: 15px
        background-color: #FDFDFD
        transition: transform 0.3s
      &:after
        width: 32px
        height: 32px
        position: absolute
        left: 1px
        top: 1px
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.4)
        background: #fff
        display: inline-block
        content: ""
        border-radius: 100%
        transition: transform 0.3s, -webkit-transform 0.3s
  .mpx-switch-checkbox
    appearance: none
    outline: 0
    text-indent: 0
    border: 1px solid #D1D1D1
    background-color: #FFFFFF
    border-radius: 3px
    width: 22px
    height: 22px
    position: relative
  .mpx-switch-checkbox-checked-v1
    color: #09BB07
    &:before
      font: normal normal normal 14px/1 "weui"
      content: "\EA08"
      font-size: 22px
      position: absolute
      top: 50%
      left: 50%
      transform: translate(-50%, -48%) scale(0.73)
      -webkit-transform: translate(-50%, -48%) scale(0.73)
  .mpx-switch-checkbox-checked-v2
    &:before
      color: #09BB07
      display: inline-block
      width: 22px
      height: 22px
      content: ""
      position: absolute
      top: 50%
      left: 50%
      transform: translate(-50%, -48%) scale(0.73)
      -webkit-transform: translate(-50%, -48%) scale(0.73)
      mask-position: 50% 50%
      -webkit-mask-position: 50% 50%
      -webkit-mask-repeat: no-repeat
      mask-repeat: no-repeat
      -webkit-mask-size: 100%
      mask-size: 100%
      background-color: currentColor
      mask-image: url('data:image/svg+xml,%3Csvg%20width%3D%2224%22%20height%3D%2224%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M8.657%2018.435L3%2012.778l1.414-1.414%204.95%204.95L20.678%205l1.414%201.414-12.02%2012.021a1%201%200%2001-1.415%200z%22%20fill-rule%3D%22evenodd%22%2F%3E%3C%2Fsvg%3E')
      -webkit-mask-image: url('data:image/svg+xml,%3Csvg%20width%3D%2224%22%20height%3D%2224%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cpath%20d%3D%22M8.657%2018.435L3%2012.778l1.414-1.414%204.95%204.95L20.678%205l1.414%201.414-12.02%2012.021a1%201%200%2001-1.415%200z%22%20fill-rule%3D%22evenodd%22%2F%3E%3C%2Fsvg%3E')
</style>
