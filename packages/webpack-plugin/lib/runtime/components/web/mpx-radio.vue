<script>
  import getInnerListeners from './getInnerListeners'

  export default {
    name: 'mpx-radio',
    data () {
      return {
        isChecked: false
      }
    },
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
    created () {
      this.isChecked = this.checked
    },
    render (createElement) {
      let mergeAfter = {
        listeners: {
          click: () => {
            if (this.disabled) {
              return
            }
            this.isChecked = true
            if (this.group) {
              this.group.notifyChange(this.value, this)
            }
          }
        },
        force: true
      }
      const style = mpxGlobal.__style === 'v2' ? 'v2' : 'v1'
      const data = {
        class: [this.disabled ? 'mpx-radio-disabled' : 'mpx-radio', this.isChecked && 'mpx-radio-input-checked-' + style],
        on: getInnerListeners(this, { mergeAfter })
      }

      return createElement('div', data, this.$slots.default)
    }
  }
</script>

<style lang="stylus">
  .mpx-radio,
  .mpx-radio-disabled
    margin 3px 3px 3px 4px
    display: inline-flex
    align-items center
    -webkit-appearance: none
    appearance: none
    margin-right: 5px
    outline: 0
    border: 1px solid #D1D1D1
    background-color: #ffffff
    border-radius: 50%
    width: 22px
    height: 22px
    position: relative
    &.mpx-radio-input-checked-v1
      background-color: #09BB07
      border-color: #09BB07
      &:before
        font: normal normal normal 14px/1 "weui"
        content: "\EA08"
        color: #ffffff
        font-size: 16px
        position: absolute
        top: 50%
        left: 50%
        transform: translate(-50%, -48%) scale(0.73)
        -webkit-transform: translate(-50%, -48%) scale(0.73)
    &.mpx-radio-input-checked-v2
      background-color: #1DC168
      border-color: #1DC168
      &:before
        color: #ffffff
        display: inline-block
        width: 18px
        height: 18px
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
  .mpx-radio-disabled
    border: 1px solid #d1d1d1
    background: #e1e1e1
    &.mpx-radio-input-checked-v1,
    &.mpx-radio-input-checked-v2
      border: 1px solid #d1d1d1
      background: #e1e1e1
      &:before
        color: #9D9D9D
</style>
