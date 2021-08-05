<template>
  <div class="swiper-container">
    <div class="swiper-button">
      <img :class="prevCls" class="swiper-img" @click="handlePrev" src="../../public/doc-svg/anli_icon_left.svg" loading="lazy" />
    </div>
    <div class="swiper" ref="wrapper">
      <div
        ref="list"
        class="swiper-list"
        v-for="(item, index) in dataList"
        :key="index"
        @click="handleClick(index)"
        @transitionend="handleEnd">
        <div class="swiper-item">
          <div>
            <div><img width="80" height="80" :src="item.img" alt="二维码" loading="lazy" /></div>
            <div>{{item.title}}</div>
          </div>
        </div>
      </div>
    </div>
    <div class="swiper-button">
      <img :class="nextCls" class="swiper-img" @click="handleNext" src="../../public/doc-svg/anli_icon_right.svg" loading="lazy" />
    </div>
  </div>
</template>

<script>
export default {
  props: {
    dataList: {
      type: Array,
      default: ()  => []
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
      nextCls: ''
    }
  },
  mounted () {
    this.$nextTick(() => {
      const list = this.$refs.list
      const resut = []
      let allWidth = 0
      for (let i = 0; i < list.length; i++) {
        const element = list[i]
        allWidth += element.offsetWidth
        resut.push({
          width: element.offsetWidth,
          left: element.offsetLeft
        })
      }
      this.wrapper = this.$refs.wrapper
      this.resut = resut
      this.allWidth = allWidth
      this.handleClick(0)
    })
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
    handlePrev () {
      if (this.current - 1 > -1) {
        clearInterval(this.timer)
        this.handleClick(this.current - 1)
      }
    },
    handleNext () {
      if (this.current + 1 < this.dataList.length) {
        clearInterval(this.timer)
        this.handleClick(this.current + 1)
      }
    },
    handleClick (index) {
      this.current = index
      const list = this.$refs.list
      list.forEach(item => {
        item.style.transition = 'none'
        item.style.transform = 'scale(1)'
      })
      list[index].style.transition = 'transform 0.3s'
      list[index].style.transform = 'scale(1.5)'
      this.$emit('change', index)
    },
    handleEnd () {
      const elementLeft = Math.floor(this.resut[this.current].left) - this.wrapper.scrollLeft
      const scrollLeft = this.wrapper.scrollLeft
      const middle = Math.floor(this.wrapper.offsetWidth / 2) - Math.floor(this.resut[this.current].width / 2)
      const minScroll = 0
      const maxScroll = this.allWidth - this.wrapper.offsetWidth
      let targetScrollLeft = scrollLeft + (elementLeft - middle)
      if (targetScrollLeft < minScroll) {
        targetScrollLeft = minScroll
      }
      if (targetScrollLeft > maxScroll) {
        targetScrollLeft = maxScroll
      }
      if (this.allWidth > this.wrapper.offsetWidth && scrollLeft !== targetScrollLeft) {
        this.animationScroll(targetScrollLeft)
      }
    },
    animationScroll (distance) {
      const minScroll = 0
      const maxScroll = this.allWidth - this.wrapper.offsetWidth
      const scrollLeft = this.wrapper.scrollLeft
      const step = Math.floor(Math.abs((scrollLeft - distance) / 200 * 20))
      let temp = 0
      clearInterval(this.timer)
      this.timer = setInterval(() => {
        // 手动触发的滚动需要立即停止动画
        if (temp && this.wrapper.scrollLeft !== temp) {
          return clearInterval(this.timer)
        }
        if (distance > scrollLeft) {
          const current = this.wrapper.scrollLeft + step
          // 左移动
          if (current > distance || current >= maxScroll) {
            clearInterval(this.timer)
            this.wrapper.scrollLeft = distance
          } else {
            this.wrapper.scrollLeft = current
            temp = current
          }
        } else {
          const current = this.wrapper.scrollLeft - step
          // 右移动
          if (current < distance || current <= minScroll) {
            clearInterval(this.timer)
            this.wrapper.scrollLeft = distance
          } else {
            this.wrapper.scrollLeft = current
            temp = current
          }
        }
      }, 20)
    }
  }
}
</script>

<style lang="stylus" scoped>
::-webkit-scrollbar
  display none
.swiper-container
  display flex
  .swiper-button
    width 140px
    margin-top 80px
    transform filter 0.3s
  .swiper-img
    cursor pointer
  .swiper-disable
    cursor not-allowed
    filter grayscale(100%)
.swiper
  flex 1
  position relative
  overflow-y hidden
  overflow-x scroll
  white-space nowrap
  height 300px
  .swiper-list
    display inline-block
    padding 24px
    border-radius 10px
    margin-top 20px
    position relative
  .swiper-item
    width 136px
    height 136px
    background #FFFFFF
    border-radius 10px
    display flex
    align-items center
    justify-content center
    cursor pointer
.swiper-list:first-child
  padding-left 50px
.swiper-list:last-child
  padding-right 50px
</style>