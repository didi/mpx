<template>
  <div class="mpx-recycle-view">
    <ScrollView ref="scrollView" :enableSticky="enableSticky" :scroll-y="true" @scroll="handleScroll" :style="{ 'width': _width, 'height': _height }">
      <div class="content-wrapper">
        <div class="infinite-list-placeholder" ref="infinitePlaceholder"></div>
        <div class="infinite-list" ref="infiniteList">
          <template v-for="item in visibleData">
            <section-header v-if="item.itemData.isSectionHeader" :key="'header' + item._index" :itemData="item.itemData"/>
            <recycle-item v-else :key="'item' + item._index" :itemData="item.itemData"/>
          </template>
        </div>
      </div>
      <template v-if="_stickyHeaders && _stickyHeaders.length && enableSticky">
        <StickyHeader v-for="stickyItem in _stickyHeaders" class="sticky-section" :style="{'top': (positions[stickyItem._index] && positions[stickyItem._index].top || 0) + 'px'}">
          <section-header :key="'header' + stickyItem._index" :itemData="stickyItem.itemData"/>
        </StickyHeader>
      </template>
    </ScrollView>
  </div>
</template>

<script>
  import ScrollView from './mpx-scroll-view.vue'
  import StickyHeader from './mpx-sticky-header.vue'


  export default {
    props: {
      listData: {
        type: Array,
        default() {
          return []
        }
      },
      enableSticky: Boolean,
      minRenderCount: {
        type: Number,
        default: 10
      },
      bufferScale: {
        type: Number,
        default: 1
      },
      'enable-sticky': {
        type: Boolean,
        default: false
      },
      'height': {
        type: [String, Number],
        default: '100%'
      },
      'width': {
        type: [String, Number],
        default: '100%'
      },
      'scroll-y': {
        type: Boolean,
        default: true
      },
      'itemHeight': {
        type: Object,
        default: {}
      },
      'listHeaderHeight': {
        type: Object,
        default: {}
      },
      'sectionHeaderHeight': {
        type: Object,
        default: {}
      },
      'type': {
        type: String,
        default: ''
      },
      'generichash': {
        type: String,
        default: ''
      },
      'genericlist-header': {
        type: String,
        default: ''
      },
      'genericrecycle-item': {
        type: String,
        default: ''
      },
      'genericsection-header': {
        type: String,
        default: ''
      },
    },
    data() {
      return {
        start: 0,
        end: 0,
        contentStyle: '',
        containerHeight: 0,
        positions: [],
        isReady: false,
        lastScrollTime: 0,
        visibleCounts: []
      }
    },
    computed: {
      _width() {
        return this.width ? `${this.width}px` : '100%'
      },
      _height() {
        return this.height ? `${this.height}px` : '100%'
      },
      _listData() {
        return this.listData.map((item, index) => {
          return {
            itemData: item,
            _index: `_${index}`
          }
        })
      },
      _stickyHeaders () {
         const data = []
         this.listData.forEach((item, index) => {
          if (item.isSectionHeader) {
            data.push({
              itemData: item,
              _index: index
            })
          }
        })
        return data
      },
      _scrollTop() {
        // 使用初始值或当前值
        return this.isReady ? this.scrollTop : 0
      },
      visibleCount() {
        if (!this.visibleCounts.length) return this.minRenderCount
        return Math.max(this.visibleCounts[this.start], this.minRenderCount)
      },
      aboveCount() {
        if (!this._listData.length || !this.visibleCounts.length) return 0
        let count = 0
        const startIndex = Math.max(0, this.start)
        const endIndex = Math.max(0, startIndex - this.bufferScale)

        for (let i = startIndex; i > endIndex; i--) {
          count += this.visibleCounts[i] || 0
        }

        return count
      },
      belowCount() {
        if (!this._listData.length || !this.visibleCounts.length) return 0
        let count = 0
        const startIndex = Math.min(this.start, this._listData.length - 1)
        const endIndex = Math.min(startIndex + this.bufferScale, this._listData.length - 1)

        for (let i = startIndex; i < endIndex; i++) {
          count += this.visibleCounts[i] || 0
        }

        return count
      },
      visibleData() {
        if (!this._listData.length) return []

        const start = Math.min(Math.max(0, this.start - this.aboveCount), this._listData.length - 1)

        let end = Math.min(this._listData.length, this.start + this.visibleCount + this.belowCount)

        // 如果接近列表末尾，确保显示所有剩余项目
        if (end > this._listData.length - 3) {
          end = this._listData.length
        }

        return this._listData.slice(start, end).map((item, idx) => {
          const realIndex = start + idx
          return {
            ...item,
            _index: `_${realIndex}`
          }
        })
      },
      totalHeight() {
        if (!this.positions.length) return 0
        return this.positions[this.positions.length - 1].bottom
      }
    },
    watch: {
      listData: {
        handler() {
          this.initPositions()
          this.setPlaceholderStyle()
          // 更新真实偏移量
          this.setStartOffset()
        }
      },
      scrollTop: {
        handler(val) {
          this.start = this.getStartIndex(val)
          this.end = this.start + this.visibleCount
          this.setStartOffset()
        },
        immediate: true
      },
      containerHeight() {
        this.calculateVisibleCounts()
      }
    },
    created() {
      if (this.generichash && global.__mpxGenericsMap[this.generichash]) {
        const components = {}
        if (this.genericrecycleItem) {
          const value = global.__mpxGenericsMap[this.generichash][this.genericrecycleItem]
          components['recycle-item'] = value
        }

        if (this.genericlistHeader) {
          const value = global.__mpxGenericsMap[this.generichash][this.genericlistHeader]
          components['list-header'] = value
        }

        if (this.genericsectionHeader) {
          const value = global.__mpxGenericsMap[this.generichash][this.genericsectionHeader]
          components['section-header'] = value
        }
        this.$options.components = Object.assign({}, this.$options.components, components)
      }
    },
    mounted() {
      this.initPositions()
      this.containerHeight = this.$refs.scrollView.clientHeight || 0
      this.isReady = true
      this.setPlaceholderStyle()
      if (!this.positions || !this.positions.length) {
        return
      }
      this.start = this.getStartIndex(this.scrollTop)
      this.end = this.start + this.visibleCount
      this.setStartOffset()
    },
    methods: {
      setPlaceholderStyle () {
        const infinitePlaceholder = this.$refs.infinitePlaceholder
        if (infinitePlaceholder) {
          infinitePlaceholder.style.height = `${this.totalHeight}px`
        }
      },
      initPositions() {
        let bottom = 0
        this.positions = this._listData.map((item, index) => {
          const height = this.getItemHeight(item.itemData, index, item.itemData.isSectionHeader ? 'sectionHeaderHeight': 'itemHeight')
          const position = {
            index,
            height: height,
            top: bottom,
            bottom: bottom + height
          }
          bottom = position.bottom
          return position
        })

        if (this.containerHeight) {
          this.calculateVisibleCounts()
        }
      },
      calculateVisibleCounts() {
        this.visibleCounts = this.positions.map((_, startIndex) => {
          let count = 0
          let totalHeight = 0

          for (let i = startIndex; i < this.positions.length; i++) {
            totalHeight += this.positions[i].height
            if (totalHeight > this.containerHeight) {
              break
            }
            count++
          }

          // 如果是最后几个项目，确保全部显示
          if (startIndex + count > this.positions.length - 3) {
            count = this.positions.length - startIndex
          }

          return count
        })
      },

      getStartIndex(scrollTop = 0) {
        // 确保不会返回超出范围的索引
        if (!this.positions.length) {
          return 0
        }

        // 如果滚动位置为0，直接返回0
        if (scrollTop <= 0) {
          return 0
        }
        const index = this.binarySearch(this.positions, scrollTop)
        return Math.max(0, Math.min(index, this._listData.length - 1))
      },
      binarySearch(list, value) {
        if (!list.length) return 0

        // 如果 scrollTop 超过了最后一个元素的底部
        if (value >= list[list.length - 1].bottom) {
          return list.length - 1
        }

        let start = 0
        let end = list.length - 1

        while (start <= end) {
          const midIndex = Math.floor((start + end) / 2)
          const midValue = list[midIndex]

          if (value >= midValue.top && value < midValue.bottom) {
            return midIndex
          }

          if (value < midValue.top) {
            end = midIndex - 1
          } else {
            start = midIndex + 1
          }
        }

        return Math.min(Math.max(0, start - 1), list.length - 1)
      },
      setStartOffset() {
        const infiniteList = this.$refs.infiniteList
        if (!this.positions.length || !infiniteList) return
        if (this.start >= 1) {
          // 确保 startIndex 不会超出范围
          const startIndex = Math.min(
            Math.max(0, this.start - this.aboveCount),
            this.positions.length - 1
          )

          const offset = this.positions[startIndex].top
          infiniteList.style.transform = `translateY(${offset}px)`
        } else {
          infiniteList.style.transform = 'none'
        }
      },
      getItemHeight(item, index, key) {
        const { value, getter } = this[key]
        if (typeof getter === 'function') {
          return getter(item, index) || 0
        } else {
          return value || 0
        }
      },
      handleScroll(e) {
        const now = Date.now()
        // 添加16ms的节流，大约60fps
        if (now - this.lastScrollTime < 16) {
          return
        }
        this.lastScrollTime = now

        const { scrollTop } = e.detail
        const newStart = this.getStartIndex(scrollTop)

        // 只有当start发生足够变化时才更新，避免滚动触发重渲染
        if (Math.abs(newStart - this.end) >= Math.floor(this.belowCount / 2)) {
          this.start = newStart
          this.end = this.start + this.visibleCount
          this.setStartOffset()
        }

        this.triggerEvent('scroll', e)
      },
      onScrollToUpper(e) {
        this.triggerEvent('scrolltoupper', e)
      },
      onScrollToLower(e) {
        this.triggerEvent('scrolltolower', e)
      },
      scrollToIndex({index, animated}) {
        const isStickyHeader = this._listData[index].itemData?.isSectionHeader
        let prevHeaderHeight = 0
        // 如果不是Sticky header 查找最近一个吸顶的 sticky header
        if (!isStickyHeader && this.enableSticky) {
           for (let i = index - 1; i >= 0; i--) {
          if (this._listData[i].itemData?.isSectionHeader) {
            prevHeaderHeight = this.positions[i].height
            break
          }
        }
        }
       
        const top = (this.positions[index]?.top || 0) - prevHeaderHeight
        this.$refs.scrollView?.bs.scrollTo(0, -top, animated ? 200 : 0)
      }
    },
    components: {
      ScrollView,
      StickyHeader
    }
  }
</script>

<style scoped>
  .mpx-recycle-view {
    position: relative;
    overflow: hidden;
  }

  .content-wrapper {
    position: relative;
    width: 100%;
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
  .sticky-section {
    position: absolute!important;
  }
</style>
