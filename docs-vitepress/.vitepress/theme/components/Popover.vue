<template>
  <div class="popover">
    <div class="popover__content" @click="handleToggle" @mouseenter="handleEnter" @mouseleave="handleLeave"><slot></slot></div>
    <div v-show="isShow" class="popover__top">
      <div class="popover__content">
        <div class="popover__inner">
          <img v-if="code" width="300" :src="code" alt="code" loading="lazy" />
          <div v-if="title">{{title}}</div>
        </div>
        <div class="popover__arrow"></div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    code: {
      type: String,
      default: ''
    },
    title: {
      type: String,
      default: ''
    }
  },
  data () {
    return {
      isShow: false,
      isClick: false
    }
  },
  methods: {
    handleEnter () {
      this.isShow = true
    },
    handleLeave () {
      this.isShow = false
    },
    handleToggle () {
      this.isClick = !this.isClick
      this.isShow = this.isClick
    }
  }
}
</script>

<style lang="stylus" scoped>
.fade-enter-active, .fade-leave-active
  transition all 0.3s
.fade-enter, .fade-leave-to
  opacity 0
.popover
  position relative
  display inline-block
  .popover__top
    position absolute
    width 300px
    height 300px
    background #fff
    left -150px
    top -350px
    border-radius 4px
  .popover__content
    position relative
    width 100%
    height 100%
  .popover__arrow
    position absolute
    left 50%
    margin-left -5px
    bottom -5px
    width 6px
    height 6px
    background #fff
    transform rotate(45deg)
    border-bottom 1px solid #EDEDED
    border-right 1px solid #EDEDED
    z-index 6
  .popover__inner
    width 100%
    height 100%
    display flex
    flex-direction column
    align-items center
    justify-content center
    font-size 14px
    position relative
    z-index 4
    background #fff
    border-radius 4px
    border 1px solid #EDEDED
  .popover__content
    display inline-block
</style>
