<!-- <template>
  <div class="swiper-container">
    <div class="swiper-button">
      <img :class="prevCls" class="swiper-img" @click="handlePrev" src="https://dpubstatic.udache.com/static/dpubimg/0cgzDC8Apn/anli_icon_left.png" width="50" height="50" alt="left" loading="lazy" />
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
      <img :class="nextCls" class="swiper-img" @click="handleNext" src="https://dpubstatic.udache.com/static/dpubimg/QhD6ulEP7k/anli_icon_right.png" width="50" height="50" alt="right" loading="lazy" />
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
  // max-width 1190px
  width 250px
  display flex
  margin 0 auto
  .swiper-button
    width 40px
    margin-top 180px
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
    width 166px
    height 60px
    display inline-block
    padding 24px
    border-radius 10px
    margin-top 20px
    position relative
  .swiper-item
    width 166px
    height 60px
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
</style> -->


<template>
  <div class="swiper" ref="swiper" @click.prevent="handleClick">
    <div
      class="swiper-list"
      :style="{
        width: swiperListWidth + 'px',
        transform: 'translateX(' + translateX + 'px)',
        transitionDuration: transitionDuration + 's',
      }"
      ref="swiperList"
      v-for="(item, index) in dataList"
    >
      <!-- <slot></slot> -->
      <!-- <SlideItem> -->
        <div>{{item.title}}</div>
      <!-- </SlideItem> -->
    </div>
    <div class="dot">
      <span
        v-for="(x, i) in sum"
        :key="'dot' + x"
        :style="{
          background: i === index ? indicatorColor : 'rgba(255, 255, 255, .5)',
        }"
        :class="[i === index ? 'on' : '']"
      >
      </span>
    </div>
  </div>
</template>
    
<script>
// import SlideItem from './slide-item.vue';
export default {
  // components: {
  //   SlideItem
  // },
  data() {
    return {
      swiperWidth: "", // 轮播图盒子的宽度
      index: this.initialIndex, // 轮播图序号
      sum: 0, // 轮播图片数量
      transitionDuration: 0.5, // 切换动画时长
      timer: "", // 定时器
      startX: "", // touchstart的起始x坐标
      offset: "", // move偏移值
      Loop: 0,
    };
  },
  props: {
    dataList: {
      type: Array,
      default: ()  => []
    },
    duration: {
      type: Number,
      default: 3000,
    },
    initialIndex: {
      type: Number,
      default: 0,
    },
    indicatorColor: {
      type: String,
      default: "#fff",
    },
  },
  computed: {
    // 轮播图列表的宽度
    swiperListWidth() {
      return this.swiperWidth * this.sum;
    },
    // 轮播图列表偏移值
    translateX() {
      return this.index * this.swiperWidth * -1;
    },
  },
  created() {
    this.$nextTick(() => {
      let swiper = this.$refs.swiper;
      // 获得轮播图的图片数量
      let swiperItems = document.querySelectorAll(".swiper-item");
      this.sum = swiperItems.length;
      // 为什么不取屏幕宽度，是因为通用性，由外部的盒子决定轮播图的宽
      this.swiperWidth = swiper.offsetWidth;
      this.autoPlay();
      // addEventListener不可以用匿名函数，因为无法解除绑定
      swiper.addEventListener("touchstart", this.touchStart);
      swiper.addEventListener("touchmove", this.touchMove);
      swiper.addEventListener("touchend", this.touchEnd);
    });
  },
  methods: {
    autoPlay() {
      this.timer = setInterval(() => {
        let index = this.index + 1;
        // 取余数运算，0%5=0，1%5=1，5%5=0，当然用if判断语句也是可以的
        this.index = index % this.sum;
        this.$emit("change", this.index);
      }, this.duration);
    },
    touchStart(e) {
      // 只记录第一根手指触发的值
      clearInterval(this.timer);
      this.transitionDuration = 0;
      this.startX = e.targetTouches[0].clientX;
    },
    touchMove(e) {
      this.offset = this.startX - e.targetTouches[0].clientX;
      this.$refs.swiperList.style.transform = `translateX(${
        this.translateX - this.offset
      }px)`;
    },
    touchEnd() {
      this.transitionDuration = 0.5;
      // 计算偏移值四舍五入，如果拖动距离大于等于0.5则换一张轮播图
      let num = Math.round(this.offset / this.swiperWidth);
      let sum = this.index + num;
      // 先计算再赋值给this.index避免重复触发计算属性，为什么这里不取余数，是因为又负数出现
      if (sum > this.sum - 1) {
        sum = 0;
      } else if (sum < 0) {
        sum = this.sum - 1;
      }
      // 解决拖动距离小于一半，index值无变化，无法触发计算属性，主动还原偏移值
      if (sum === this.index) {
        this.$refs.swiperList.style.transform = `translateX(${this.translateX}px)`;
      } else {
        this.index = sum;
        this.$emit("change", this.index);
      }
      // 解决当第一次手势滑动后，再次点击offset不跟新问题
      this.offset = 0;
      this.autoPlay();
    },
    handleClick(e) {
      e.preventDefault();
      this.$emit("click", this.index);
    },
  },
  // 实例销毁之前，移除绑定事件
  beforeDestroy() {
    let swiper = this.$refs.swiper;
    swiper.removeEventListener("touchstart", this.touchStart);
    swiper.removeEventListener("touchmove", this.touchMove);
    swiper.removeEventListener("touchend", this.touchEnd);
  },
};
</script>
    
<style scoped>
.swiper {
  position: relative;
  width: 100%;
  height: 200px;
  /* overflow: hidden; */
  .swiper-list {
    display: flex;
    width: 100%;
    height: 100%;
    transition-property: all;
    transition-timing-function: cubic-bezier(0.18, 0.89, 0.32, 1.28);
  }
  .dot {
    display: flex;
    position: absolute;
    width: 100%;
    margin-top: -15px;
    justify-content: center;
    span {
      @size: 8px;
      width: @size;
      height: @size;
      background-color: rgba(255, 255, 255, 0.5);
      border-radius: 50%;
      margin-left: 5px;
    }
    .on {
      width: 12px;
      border-radius: 30%;
      transition: width 0.3s linear;
    }
  }
}
</style>
