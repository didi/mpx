<template>
  <div class="swiper-container" ref="container" :style="getStyle">
    <div class="swiper" ref="wrapper" @touchstart="handleStart" @touchmove="handleMove" @touchend="handleEnd">
      <div
        ref="list"
        class="swiper-list"
        v-for="(item, index) in dataList"
        :key="index"
        :style="getWidth">
        <slot :item="item"></slot>
      </div>
    </div>
    <ul class="swiper-dot" v-if="dot">
      <li class="swiper-icon" :class="{ active: current === index }" v-for="(item, index) in dataList" :key="index"></li>
    </ul>
  </div>
</template>

<script>

export default {
  props: {
    dataList: {
      type: Array,
      default: ()  => []
    },
    height: {
      type: Number,
      default: 152
    },
    autoPlay: {
      type: Boolean,
      default: true
    },
    currentIndex: {
      type: Number,
      default: 0
    },
    dot: {
      type: Boolean,
      default: false
    }
  },
  data () {
    return {
      msg: '',
      current: 0,
      resut: [],
      allWidth: 0,
      timer: 0,
      prevCls: 'swiper-disable',
      nextCls: '',
      offsetWidth: 0,
      isMove: false,
      timeout: 0
    }
  },
  computed: {
    getStyle () {
      return `height: ${this.height}px;`
    },
    getWidth () {
      return `width: ${this.offsetWidth}px;`
    }
  },
  mounted () {
    this.$nextTick(() => {
      const container = this.$refs.container
      this.offsetWidth = container.offsetWidth
      if (this.autoPlay) {
        this.animationScroll()
      }
      window.addEventListener('resize', () => {
        this.offsetWidth = container.offsetWidth
      }, false)

    })
    this.touchInfo = { clientX: 0, clientY: 0, moveX: 0 }
  },
  watch: {
    current (newVal) {
      if (newVal === 0) {
        this.prevCls = 'swiper-disable'
      } else {
        this.prevCls = ''
      }
      if (newVal === this.dataList.length - 1) {
        this.nextCls = 'swiper-disable'
      } else {
        this.nextCls = ''
      }
    }
  },
  methods: {
    animationScroll () {
      clearInterval(this.timer)
      this.timer = setInterval(() => {
        this.handleNext()
      }, 3000)
    },
    handlePrev (type) {
      const wrapper = this.$refs.wrapper
      this.current--
      if (this.current === -1) {
        this.current = 0
      }
      wrapper.style.transform = `translateX(${-this.current * this.offsetWidth}px)`
      if (type !== 'off') {
        this.$emit('change', this.current)
      }
    },
    handleNext (type) {
      const wrapper = this.$refs.wrapper
      if (!wrapper) return
      this.current++
      if (this.current === this.dataList.length) {
        this.current = 0
      }
      wrapper.style.transform = `translateX(${-this.current * this.offsetWidth}px)`
      if (type !== 'off') {
        this.$emit('change', this.current)
      }
    },
    handleSelect (index) {
      clearInterval(this.timer)
      clearTimeout(this.timeout)
      this.current = index
      const wrapper = this.$refs.wrapper
      wrapper.style.transform = `translateX(${-this.current * this.offsetWidth}px)`
      if (this.autoPlay) {
        this.timeout = setTimeout(() => {
          this.animationScroll()
        }, 3000)
      }
    },
    handleStart (e) {
      clearInterval(this.timer)
      clearTimeout(this.timeout)
      const touch = e.touches[0]
      this.touchInfo = { clientX: touch.clientX }
      this.isMove = true
    },
    handleMove (e) {
      const wrapper = this.$refs.wrapper
      const touch = e.touches[0]
      const moveX = touch.clientX - this.touchInfo.clientX
      const distance = this.current * this.offsetWidth  - moveX
      wrapper.style.transform = `translateX(${-distance}px)`
      wrapper.style.transition = 'transform 0s'
      this.touchInfo.moveX = moveX
    },
    handleEnd () {
      this.isMove = false
      const moveX = this.touchInfo.moveX || 0
      let nextPage = 0
      if (Math.abs(moveX) < 20) {
        // 归位
        nextPage = 0
      } else if (moveX < 0) {
        // 下一张
        if (this.current === this.dataList.length - 1) {
          nextPage = 0
        } else {
          nextPage = 1
        }
      } else {
        // 上一张
        if (this.current === 0) {
          nextPage = 0
        } else {
          nextPage = -1
        }
      }
      const wrapper = this.$refs.wrapper
      wrapper.style.transition = 'transform 0.3s'
      switch (nextPage) {
        case 0:
          wrapper.style.transform = `translateX(${-this.current * this.offsetWidth}px)`
          break;
        case 1:
          this.handleNext()
          break;
        case -1:
          this.handlePrev()
          break;
      }
      this.touchInfo = {}
      if (this.autoPlay) {
        this.timeout = setTimeout(() => {
          this.animationScroll()
        }, 3000)
      }
    }
  }
}
</script>

<style lang="stylus" scoped>
::-webkit-scrollbar
  display none
.swiper-container
  position relative
  width 100%
  height 152px
  overflow hidden
.swiper
  height 100%
  white-space nowrap
  transform translateX(0)
  display inline-block
  transition transform 0.3s
.swiper-list
  width 100%
  // height 132px
  display inline-block
.swiper-dot
  position absolute
  left 50%
  bottom 12px
  display flex
  padding 0
  z-index 3
  transform translate3d(-50%, 0, 0)
.swiper-icon
  list-style none
  width 6px
  height 6px
  border-radius 50%
  background #EFEFEF
  margin 0 3px
.active
  background #00BD81
</style>