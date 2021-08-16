<template>
  <div class="popover">
    <div class="popover__content" @mouseenter="handleEnter" @mouseleave="handleLeave"><slot></slot></div>
    <transition name="fade">
      <div v-show="isShow" class="popover__top">
        <div class="popover__content">
          <div class="popover__inner">
            <img v-if="code" width="110" :src="code" alt="code" loading="lazy" />
            <div v-if="title">{{title}}</div>
          </div>
          <div class="popover__arrow"></div>
        </div>
      </div>
    </transition>
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
      isShow: false
    }
  },
  methods: {
    handleEnter () {
      this.isShow = true
    },
    handleLeave () {
      this.isShow = false
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
  .popover__top
    position absolute
    width 150px
    height 158px
    background #fff
    left -55px
    top -178px
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
    width 10px
    height 10px
    background #fff
    transform rotate(45deg)
  .popover__inner
    width 100%
    height 100%
    display flex
    flex-direction column
    align-items center
    justify-content center
    font-size 14px
  .popover__content
    display inline-block
</style>