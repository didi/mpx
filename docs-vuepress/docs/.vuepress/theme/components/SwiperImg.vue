<template>
  <div class="swiper-img">
    <div class="swiper-img__list" :style="getStyle">
      <div class="swiper-img__wrap" v-for="(item, index) in dataList" :key="index">
        <img width="188" height="410" :src="item.demo" alt="img" loading="lazy" />
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    dataList: {
      type: Array,
      default: () => []
    },
    currentIndex: {
      type: Number,
      default: 0
    }
  },
  data () {
    return {
      translateX: 0
    }
  },
  computed: {
    getStyle () {
      return { transform: `translate3d(${-this.currentIndex * 188}px, 0, 0)` }
    }
  },
  watch: {
    currentIndex (newVal) {
    }
  }
}
</script>

<style lang="stylus" scoped>
.swiper-img
  width 188px
  height 408px
  height 100%
  white-space nowrap
  overflow hidden
  border-radius 20px
  .swiper-img__wrap
    display inline-block
  .swiper-img__list
    transform translate3d(0, 0, 0)
    transition transform 0.3s
</style>