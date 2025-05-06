<script>
  import getInnerListeners from './getInnerListeners'
  // 获取当前小程序样式版本配置
  const styleVersion = mpxGlobal.__style || ''
  const sizeClassMap = {
    'default': '',
    'mini': 'mpx-button-size-mini'
  }
  const typeClassMap = {
    'primary': 'mpx-button-type-primary',
    'warn': 'mpx-button-type-warn'
  }
  const plainClassMap = {
    'false': '',
    'true': 'mpx-button-plain'
  }
  const disabledClassMap = {
    'false': '',
    'true': 'mpx-button-disabled'
  }
  const clickDisabledClassMap = {
    'false': '',
    'true': 'mpx-button-click-disabled'
  }
  const loadingClassMap = {
    'false': '',
    'true': 'mpx-button-loading'
  }
  export default {
    name: 'mpx-button',
    data () {
      return {
        hover: false
      }
    },
    props: {
      name: String,
      size: {
        type: String,
        default: 'default'
      },
      type: {
        type: String,
        default: 'default'
      },
      plain: Boolean,
      disabled: Boolean,
      loading: Boolean,
      formType: String,
      hoverClass: {
        type: String,
        default: 'button-hover'
      },
      hoverStopPropagation: {
        type: Boolean,
        default: false
      },
      hoverStartTime: {
        type: Number,
        default: 20
      },
      hoverStayTime: {
        type: Number,
        default: 70
      }
    },
    computed: {
      className () {
        if (this.hoverClass && this.hoverClass !== 'none' && this.hover) {
          return this.hoverClass
        }
        return ''
      },
      classNameList () {
        let classArr = []
        if (this.hoverClass && this.hoverClass !== 'none' && this.hover) {
          classArr.push(this.hoverClass)
        }
        if (styleVersion === 'v2') {
          classArr.push(`${sizeClassMap[this.size]}${styleVersion}`)
          classArr.push(`${typeClassMap[this.type]}${styleVersion}`)
          classArr.push(`mpx-button-version${styleVersion}`)
        } else {
          classArr.push(sizeClassMap[this.size])
          classArr.push(typeClassMap[this.type])
          classArr.push(`mpx-button-version`)
        }
        classArr.push(plainClassMap[this.plain])
        classArr.push(disabledClassMap['' + !!this.disabled])
        // 禁用click
        classArr.push(clickDisabledClassMap['' + !!this.disabled])
        classArr.push(loadingClassMap['' + !!this.loading])
        return classArr
      }
    },
    mounted () {
      if (this.formType) {
        this.$el.addEventListener('tap', () => {
          if (this.form && this.form[this.formType]) {
            this.form[this.formType]()
          }
        })
      }
    },
    render (createElement) {
      let mergeAfter
      if (this.hoverClass && this.hoverClass !== 'none') {
        mergeAfter = {
          listeners: {
            touchstart: this.handleTouchstart,
            touchend: this.handleTouchend
          },
          force: true
        }
      }
      const domProps = {
        name: this.name,
        disabled: this.disabled,
        loading: this.loading,
        plain: this.plain,
        type: this.type
      }
      const data = {
        class: ['mpx-button', ...this.classNameList],
        domProps,
        on: getInnerListeners(this, {
          mergeAfter,
          // 由于当前机制下tap事件只有存在tap监听才会触发，为了确保该组件能够触发tap，传递一个包含tap的defaultListeners用于模拟存在tap监听
          defaultListeners: ['tap']
        })
      }
      return createElement('div', data, this.$slots.default)
    },
    methods: {
      handleTouchstart (e) {
        if (e.__hoverStopPropagation) {
          return
        }
        e.__hoverStopPropagation = this.hoverStopPropagation
        clearTimeout(this.startTimer)
        this.startTimer = setTimeout(() => {
          this.hover = true
        }, this.hoverStartTime)
      },
      handleTouchend () {
        clearTimeout(this.endTimer)
        this.endTimer = setTimeout(() => {
          this.hover = false
        }, this.hoverStayTime)
      }
    }
  }
</script>

<style lang="stylus">
  .mpx-button-versionv2
    width: 184px
    line-height 1.41176471
    font-weight: 700;
    padding-top 8px
    padding-bottom 8px
  .mpx-button-version
    width: 100%
    line-height 2.55555556
    cursor: pointer
    &:after
      border 1px solid rgba(0,0,0,.2)

  .mpx-button
    padding-left: 14px
    padding-right: 14px
    border none
    outline: none
    position relative
    display block
    margin-left auto
    margin-right auto
    box-sizing border-box
    font-size 18px
    text-align center
    text-decoration none
    border-radius 5px
    -webkit-tap-highlight-color transparent
    overflow hidden
    color #000
    background-color #f8f8f8
    &:after
      content " "
      width 200%
      height 200%
      position absolute
      top 0
      left 0
      -webkit-transform scale(.5)
      transform scale(.5)
      -webkit-transform-origin 0 0
      transform-origin 0 0
      box-sizing border-box
      border-radius 10px

    &.button-hover
      background-color #dedede

    /* 默认版本 size=mini style */
    &.mpx-button-size-mini
      display inline-block
      line-height 2.3
      font-size 13px
      padding 0 1.34em
      width auto
    /* v2 size=mini style */
    &.mpx-button-size-miniv2
      width auto
      padding 0 0.75em
      line-height 2
      font-size 16px
      display inline-block
    &.mpx-button-plain
      color #353535
      border 1px solid #353535
      background-color transparent
      &.mpx-button-plain.button-hover
        background-color rgba(0, 0, 0, 0)
        color #828282
        border 1px solid #828282

    /* 默认版本 type=primary style */
    &.mpx-button-type-primary
      background-color #1aad19
      color #fff
      &.mpx-button-type-primary.mpx-button-plain
        color #1aad19
        border-color #1aad19
        background-color #fff
    /* v2 type=primary style */
    &.mpx-button-type-primaryv2
      background-color #07c160
      color #fff
      &.mpx-button-type-primaryv2.button-hover
        color #fff
        background-color #06ad56
      &.mpx-button-type-primaryv2.mpx-button-plain
        color #06ae56
        border-color #179c16
        background-color #fff
      &.mpx-button-type-primaryv2.button-hover.mpx-button-plain
        color #06ae56
        background-color rgba(0, 0, 0, .1)

    /* 默认版本 type=warn style */
    &.mpx-button-type-warn
      color #fff
      background-color #e64340
      &.mpx-button-type-warn.mpx-button-plain
        color #e64340
        background-color transparent
        border 1px solid #e64340
    /* v2 type=warn style */
    &.mpx-button-type-warnv2
      color #fa5151
      background-color #f2f2f2
      &.mpx-button-type-warnv2.button-hover
        background-color #d9d9d9
      &.mpx-button-type-warnv2.mpx-button-plain
        color #fa5151
        background-color #fff
        border 1px solid #e64340
      &.mpx-button-type-warnv2.button-hover.mpx-button-plain
        color: #f58c8d
        border 1px solid #f58a8b
        background-color #fff

    &.mpx-button-disabled
      color rgba(0, 0, 0, 0.18) !important
      background-color #fafafa !important
      border 1px solid rgba(0, 0, 0, .2) !important
    &.mpx-button-click-disabled
      pointer-events none
    &.mpx-button-loading
      &.mpx-button-type-warn
        color rgba(255,255,255,.6)
        background-color #ce3c39
      &.mpx-button-type-warnv2
        background-color #d9d9d9
        color #fa5151
      &.mpx-button-type-primary
        color: rgba(255,255,255,.6);
        background-color: #179b16;
      &:before
        content: " "
        display: inline-block
        width: 18px
        height: 18px
        vertical-align: middle
        -webkit-animation: mpxButton 1s steps(12,end) infinite
        animation: mpxButton 1s steps(12,end) infinite
        background transparent url('data:image/svg+xml;base64,PHN2ZyBjbGFzcz0iciIgd2lkdGg9JzEyMHB4JyBoZWlnaHQ9JzEyMHB4JyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj4KICAgIDxyZWN0IHg9IjAiIHk9IjAiIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSJub25lIiBjbGFzcz0iYmsiPjwvcmVjdD4KICAgIDxyZWN0IHg9JzQ2LjUnIHk9JzQwJyB3aWR0aD0nNycgaGVpZ2h0PScyMCcgcng9JzUnIHJ5PSc1JyBmaWxsPScjRTlFOUU5JwogICAgICAgICAgdHJhbnNmb3JtPSdyb3RhdGUoMCA1MCA1MCkgdHJhbnNsYXRlKDAgLTMwKSc+CiAgICA8L3JlY3Q+CiAgICA8cmVjdCB4PSc0Ni41JyB5PSc0MCcgd2lkdGg9JzcnIGhlaWdodD0nMjAnIHJ4PSc1JyByeT0nNScgZmlsbD0nIzk4OTY5NycKICAgICAgICAgIHRyYW5zZm9ybT0ncm90YXRlKDMwIDUwIDUwKSB0cmFuc2xhdGUoMCAtMzApJz4KICAgICAgICAgICAgICAgICByZXBlYXRDb3VudD0naW5kZWZpbml0ZScvPgogICAgPC9yZWN0PgogICAgPHJlY3QgeD0nNDYuNScgeT0nNDAnIHdpZHRoPSc3JyBoZWlnaHQ9JzIwJyByeD0nNScgcnk9JzUnIGZpbGw9JyM5Qjk5OUEnCiAgICAgICAgICB0cmFuc2Zvcm09J3JvdGF0ZSg2MCA1MCA1MCkgdHJhbnNsYXRlKDAgLTMwKSc+CiAgICAgICAgICAgICAgICAgcmVwZWF0Q291bnQ9J2luZGVmaW5pdGUnLz4KICAgIDwvcmVjdD4KICAgIDxyZWN0IHg9JzQ2LjUnIHk9JzQwJyB3aWR0aD0nNycgaGVpZ2h0PScyMCcgcng9JzUnIHJ5PSc1JyBmaWxsPScjQTNBMUEyJwogICAgICAgICAgdHJhbnNmb3JtPSdyb3RhdGUoOTAgNTAgNTApIHRyYW5zbGF0ZSgwIC0zMCknPgogICAgPC9yZWN0PgogICAgPHJlY3QgeD0nNDYuNScgeT0nNDAnIHdpZHRoPSc3JyBoZWlnaHQ9JzIwJyByeD0nNScgcnk9JzUnIGZpbGw9JyNBQkE5QUEnCiAgICAgICAgICB0cmFuc2Zvcm09J3JvdGF0ZSgxMjAgNTAgNTApIHRyYW5zbGF0ZSgwIC0zMCknPgogICAgPC9yZWN0PgogICAgPHJlY3QgeD0nNDYuNScgeT0nNDAnIHdpZHRoPSc3JyBoZWlnaHQ9JzIwJyByeD0nNScgcnk9JzUnIGZpbGw9JyNCMkIyQjInCiAgICAgICAgICB0cmFuc2Zvcm09J3JvdGF0ZSgxNTAgNTAgNTApIHRyYW5zbGF0ZSgwIC0zMCknPgogICAgPC9yZWN0PgogICAgPHJlY3QgeD0nNDYuNScgeT0nNDAnIHdpZHRoPSc3JyBoZWlnaHQ9JzIwJyByeD0nNScgcnk9JzUnIGZpbGw9JyNCQUI4QjknCiAgICAgICAgICB0cmFuc2Zvcm09J3JvdGF0ZSgxODAgNTAgNTApIHRyYW5zbGF0ZSgwIC0zMCknPgogICAgPC9yZWN0PgogICAgPHJlY3QgeD0nNDYuNScgeT0nNDAnIHdpZHRoPSc3JyBoZWlnaHQ9JzIwJyByeD0nNScgcnk9JzUnIGZpbGw9JyNDMkMwQzEnCiAgICAgICAgICB0cmFuc2Zvcm09J3JvdGF0ZSgyMTAgNTAgNTApIHRyYW5zbGF0ZSgwIC0zMCknPgogICAgPC9yZWN0PgogICAgPHJlY3QgeD0nNDYuNScgeT0nNDAnIHdpZHRoPSc3JyBoZWlnaHQ9JzIwJyByeD0nNScgcnk9JzUnIGZpbGw9JyNDQkNCQ0InCiAgICAgICAgICB0cmFuc2Zvcm09J3JvdGF0ZSgyNDAgNTAgNTApIHRyYW5zbGF0ZSgwIC0zMCknPgogICAgPC9yZWN0PgogICAgPHJlY3QgeD0nNDYuNScgeT0nNDAnIHdpZHRoPSc3JyBoZWlnaHQ9JzIwJyByeD0nNScgcnk9JzUnIGZpbGw9JyNEMkQyRDInCiAgICAgICAgICB0cmFuc2Zvcm09J3JvdGF0ZSgyNzAgNTAgNTApIHRyYW5zbGF0ZSgwIC0zMCknPgogICAgPC9yZWN0PgogICAgPHJlY3QgeD0nNDYuNScgeT0nNDAnIHdpZHRoPSc3JyBoZWlnaHQ9JzIwJyByeD0nNScgcnk9JzUnIGZpbGw9JyNEQURBREEnCiAgICAgICAgICB0cmFuc2Zvcm09J3JvdGF0ZSgzMDAgNTAgNTApIHRyYW5zbGF0ZSgwIC0zMCknPgogICAgPC9yZWN0PgogICAgPHJlY3QgeD0nNDYuNScgeT0nNDAnIHdpZHRoPSc3JyBoZWlnaHQ9JzIwJyByeD0nNScgcnk9JzUnIGZpbGw9JyNFMkUyRTInCiAgICAgICAgICB0cmFuc2Zvcm09J3JvdGF0ZSgzMzAgNTAgNTApIHRyYW5zbGF0ZSgwIC0zMCknPgogICAgPC9yZWN0Pgo8L3N2Zz4=') no-repeat
        background-size: 100%
        margin -0.2em 0.34em 0 0

  @keyframes mpxButton
    0%
      transform: rotate3d(0, 0, 1, 0deg)
    100%
      transform: rotate3d(0, 0, 1, 360deg)
</style>
