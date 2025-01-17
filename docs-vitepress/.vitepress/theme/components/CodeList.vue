<template>
  <div class="code-list">
    <div class="code-list__item" v-for="(item, index) in dataList" :key="index">
      <!-- <popover :code="item.code">
        <div class="code-list__inner" @mouseenter="handleEnter(index)" @mouseleave="handleLeave">
          <img width="40" :src="item.icon1" alt="code" loading="lazy" />
          <transition name="fade">
            <img width="40" class="code-list__big" v-show="current===index" :src="item.icon2" alt="code" loading="lazy" />
          </transition>
        </div>
      </popover> -->
      <img width="150" style="height: 170px;" :src="item.code" alt="code" loading="lazy" />
    </div>
  </div>
</template>

<script>
import Popover from './Popover.vue'

export default {
  components: {
    Popover
  },
  props: {
    dataList: {
      type: Array,
      default: () => []
    }
  },
  data () {
    return {
      current: -1
    }
  },
  methods: {
    handleEnter (index) {
      this.current = index
    },
    handleLeave () {
      this.current = -1
    }
  }
}
</script>

<style lang="stylus" scoped>
.fade-enter-active, .fade-leave-active
  transition all 0.3s
.fade-enter, .fade-leave-to
  opacity 0
.code-list
  margin-top 40px
  display flex
  .code-list__item
    margin-right 62px
    width 150px
    height 170px
    cursor pointer
  .code-list__inner
    position relative
  .code-list__big
    position absolute
    left 0
    top 0
    transform scale(1.5)
</style>