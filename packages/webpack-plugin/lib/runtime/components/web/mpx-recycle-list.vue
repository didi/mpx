<template>
  <div ref="wrapper" :style="{ height }" class="mpx-recycle-list">
    <div class="content-wrapper">
      <div ref="placeholder" class="infinite-list-placeholder"></div>

      <div ref="content" class="infinite-list">
        <div class="infinite-list-item" ref="items" :id="item._index" :key="item._index"
          :style="{ height: itemSize.height + 'px', overflow: 'hidden' }" v-for="item in visibleData">
          <slot ref="slot" :item="item.item"></slot>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
  import BScroll from "@better-scroll/core";
  export default {
    name: "mpx-recycle-list",
    props: {
      listData: {
        type: Array,
        default: () => [],
      },
      //预估尺寸
      itemSize: {
        type: Object,
        required: true,
      },
      //缓冲区比例
      bufferScale: {
        type: Number,
        default: 2,
      },
      height: {
        type: String,
        default: "100%",
      },
      scrollX: Boolean,
      scrollY: Boolean,
      upperThreshold: {
        type: [Number, String],
        default: 50,
      },
      lowerThreshold: {
        type: [Number, String],
        default: 50,
      },
      scrollTop: {
        type: [Number, String],
        default: 0,
      },
      scrollLeft: {
        type: [Number, String],
        default: 0,
      },
      scrollOptions: {
        type: Object,
        default: () => {
          return {};
        },
      },
      scrollIntoView: String,
      scrollWithAnimation: Boolean,
      enableFlex: Boolean,
      enhanced: Boolean,
      refresherEnabled: Boolean,
      refresherTriggered: Boolean,
      refresherThreshold: {
        type: Number,
        default: 45,
      },
      refresherDefaultStyle: {
        type: String,
        default: "black",
      },
      refresherBackground: {
        type: String,
        default: "",
      },
    },
    computed: {
      _listData() {
        return this.listData.map((item, index) => {
          return {
            _index: `_${index}`,
            item,
          };
        });
      },
      visibleCount() {
        return Math.ceil(this.screenHeight / this.itemSize.height);
      },
      aboveCount() {
        return Math.min(this.start, this.bufferScale * this.visibleCount);
      },
      belowCount() {
        return Math.min(
          this.listData.length - this.end,
          this.bufferScale * this.visibleCount
        );
      },
      visibleData() {
        let start = this.start - this.aboveCount;
        let end = this.end + this.belowCount;
        return this._listData.slice(start, end);
      },
    },
    watch: {
      listData: {
        handler() {
          this.initPositions();
        },
        immediate: true
      }
    },
    created() {
      this.initPositions();
    },
    updated() {
      this.$nextTick(function () {
        if (!this.$refs.items || !this.$refs.items.length) {
          return;
        }
        //更新列表总高度
        let height = this.positions[this.positions.length - 1].bottom;
        this.$refs.placeholder.style.height = height + "px";
        this.bs.refresh()
        //更新真实偏移量
        this.setStartOffset();
      });
    },
    data() {
      return {
        screenHeight: 0,
        start: 0,
        end: 0,
        currentX: 0,
        currentY: 0,
        lastX: 0,
        lastY: 0
      };
    },
    mounted() {
      this.initBs();
      this.screenHeight = this.$el.clientHeight;
      this.start = 0;
      this.end = this.start + this.visibleCount;
    },
    methods: {
      initBs() {
        this.destroyBs();
        const originBsOptions = {
          startX: -this.currentX,
          startY: -this.currentY,
          scrollX: this.scrollX,
          scrollY: this.scrollY,
          probeType: 3,
          bounce: false,
          stopPropagation: true,
          bindToWrapper: true,
          useTransition: false, // 使用 transform 代替 transition
          HWCompositing: true,
          eventPassthrough:
            (this.scrollX && "vertical") || (this.scrollY && "horizontal") || "",
        };
        const bsOptions = Object.assign({}, originBsOptions, this.scrollOptions);
        this.bs = new BScroll(this.$refs.wrapper, bsOptions);
        this.lastX = -this.currentX;
        this.lastY = -this.currentY;
        this.bs.on("scroll", () => {
          this.scrollEvent()
        });
        this.bs.on("scrollEnd", () => {
          this.currentX = -this.bs.x;
          this.currentY = -this.bs.y;
        });
      },
      destroyBs() {
        if (!this.bs) return;
        this.bs.destroy();
        delete this.bs;
      },
      initPositions() {
        const { height } = this.itemSize
        this.positions = this.listData.map((d, index) => ({
          index,
          height: height,
          top: index * height,
          bottom: (index + 1) * height,
        }));
      },
      getStartIndex(scrollTop = 0) {
        return this.binarySearch(this.positions, scrollTop);
      },
      binarySearch(list, value) {
        let start = 0;
        let end = list.length - 1;
        let tempIndex = null;

        while (start <= end) {
          let midIndex = parseInt((start + end) / 2);
          let midValue = list[midIndex].bottom;
          if (midValue === value) {
            return midIndex + 1;
          } else if (midValue < value) {
            start = midIndex + 1;
          } else if (midValue > value) {
            if (tempIndex === null || tempIndex > midIndex) {
              tempIndex = midIndex;
            }
            end = end - 1;
          }
        }
        return tempIndex;
      },
      setStartOffset() {
        let startOffset;
        if (this.start >= 1) {
          let size =
            this.positions[this.start].top -
            (this.positions[this.start - this.aboveCount]
              ? this.positions[this.start - this.aboveCount].top
              : 0);
          startOffset = this.positions[this.start - 1].bottom - size;
        } else {
          startOffset = 0;
        }
        this.$refs.content.style.transform = `translate3d(0,${startOffset}px,0)`;
      },
      scrollEvent() {
        let scrollTop = -this.bs.y;
        this.start = this.getStartIndex(scrollTop);
        this.end = this.start + this.visibleCount;
        this.setStartOffset();
      },
    },
  };
</script>

<style scoped>
  .mpx-recycle-list {
    position: relative;
    overflow: hidden;
  }

  .content-wrapper {
    position: relative;
    width: 100%;
    overflow: hidden;
  }

  .infinite-list {
    left: 0;
    right: 0;
    top: 0;
    position: absolute;
    will-change: transform;
    -webkit-backface-visibility: hidden;
    backface-visibility: hidden;
  }
</style>
