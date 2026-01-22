<template>
  <div class="mpx-recycle-view">
    <ScrollView
      ref="scrollView"
      :enableSticky="enableSticky"
      :scroll-y="true"
      :enhanced="enhanced"
      :scrollWithAnimation="scrollWithAnimation"
      :refresherEnabled="refresherEnabled"
      :refresherTriggered="refresherTriggered"
      :scrollOptions="scrollOptions"
      @scroll="onScroll"
      @scrolltolower="onScrolltolower"
      @refresherrefresh="onRefresherrefresh"
      :style="scrollViewStyle"
    >
      <div class="content-wrapper">
        <template v-if="useListHeader">
          <list-header :listHeaderData="listHeaderData"></list-header>
        </template>
        <div class="infinite-list-placeholder" ref="infinitePlaceholder"></div>
        <div class="infinite-list" ref="infiniteList">
          <template v-for="item in visibleData">
            <section-header
              v-if="item.itemData.isSectionHeader"
              :key="'header' + item._index"
              :itemData="item.itemData"
            />
            <recycle-item
              v-if="!item.itemData.isSectionHeader"
              :key="'item' + item._index"
              :itemData="item.itemData"
            />
          </template>
        </div>
        <template v-if="useListFooter">
          <list-footer :listFooterData="listFooterData"></list-footer>
        </template>
      </div>
      <template
        v-if="
          _stickyHeaders &&
          _stickyHeaders.length &&
          enableSticky &&
          genericsectionHeader
        "
      >
        <StickyHeader
          v-for="stickyItem in _stickyHeaders"
          :key="stickyItem._index"
          class="sticky-section"
          :style="{
            top:
              ((positions[stickyItem._index] &&
                positions[stickyItem._index].top) ||
                0) + 'px',
          }"
        >
          <section-header
            :key="'header' + stickyItem._index"
            :itemData="stickyItem.itemData"
          />
        </StickyHeader>
      </template>
    </ScrollView>
  </div>
</template>

<script>
import ScrollView from "./mpx-scroll-view.vue";
import StickyHeader from "./mpx-sticky-header.vue";

export default {
  props: {
    width: String | Number,
    height: String | Number,
    listData: {
      type: Array,
      default: () => {
        return []
      }
    },
    scrollOptions: {
      type: Object,
      default: () => {
        return {}
      }
    },
    minRenderCount: {
      type: Number,
      default: 10,
    },
    bufferScale: {
      type: Number,
      default: 1,
    },
    itemHeight: {
      type: Object,
      default: () => {
        return {}
      }
    },
    listHeaderHeight: {
      type: Object,
      default: () => {
        return {}
      }
    },
    sectionHeaderHeight: {
      type: Object,
      default: () => {
        return {}
      }
    },
    listHeaderData: {
      type: Object,
      default: () => {
        return {}
      }
    },
    enhanced: {
      type: Boolean,
      default: false
    },
    refresherEnabled: {
      type: Boolean,
      default: false
    },
    refresherTriggered: {
      type: Boolean,
      default: false
    },
    enableSticky: {
      type: Boolean,
      default: false
    },
    scrollWithAnimation: {
      type: Boolean,
      default: false
    },
    useListHeader: {
      type: Boolean,
      default: true
    },
    listFooterData: {
      type: Object,
      default: () => {
        return {}
      }
    },
    useListFooter: {
      type: Boolean,
      default: false
    },
    generichash: String,
    genericlistHeader: String,
    genericlistFooter: String,
    genericrecycleItem: String,
    genericsectionHeader: String
  },
  data() {
    return {
      start: 0,
      end: 0,
      containerHeight: 0,
      positions: [],
      visibleCounts: [],
    };
  },
  computed: {
    _listData() {
      return (this.listData && this.listData.map((item, index) => {
        return {
          itemData: item,
          _index: `_${index}`,
        };
      })) || [];
    },
    _stickyHeaders() {
      const data = [];
      this.listData && this.listData.forEach((item, index) => {
        if (item.isSectionHeader) {
          data.push({
            itemData: item,
            _index: index,
          });
        }
      });
      return data;
    },
    scrollViewStyle() {
      return `height: ${this.formatDimension(
        this.height
      )};width: ${this.formatDimension(this.width)}`;
    },
    visibleCount() {
      if (!this.visibleCounts.length) return this.minRenderCount;
      return Math.max(this.visibleCounts[this.start], this.minRenderCount);
    },
    aboveCount() {
      if (!this._listData.length || !this.visibleCounts.length) return 0;
      let count = 0;
      const startIndex = Math.max(0, this.start);
      const endIndex = Math.max(0, startIndex - this.bufferScale);

      for (let i = startIndex; i > endIndex; i--) {
        count += this.visibleCounts[i] || 0;
      }

      return count;
    },
    belowCount() {
      if (!this._listData.length || !this.visibleCounts.length) return 0;
      let count = 0;
      const startIndex = Math.min(this.start, this._listData.length - 1);
      const endIndex = Math.min(
        startIndex + this.bufferScale,
        this._listData.length - 1
      );

      for (let i = startIndex; i < endIndex; i++) {
        count += this.visibleCounts[i] || 0;
      }

      return count;
    },
    visibleData() {
      if (!this._listData.length) return [];

      const start = Math.min(
        Math.max(0, this.start - this.aboveCount),
        this._listData.length - 1
      );

      let end = Math.min(
        this._listData.length,
        this.start + this.visibleCount + this.belowCount
      );

      // 如果接近列表末尾，确保显示所有剩余项目
      if (end > this._listData.length - 3) {
        end = this._listData.length;
      }

      return this._listData.slice(start, end).map((item, idx) => {
        const realIndex = start + idx;
        return {
          ...item,
          _index: `_${realIndex}`,
        };
      });
    },
    _listHeaderHeight() {
      let listHeaderHeight = 0;
      if (this.useListHeader) {
        listHeaderHeight =
          this.getItemHeight(this.listHeaderData, 0, "listHeaderHeight") || 0;
      }
      return listHeaderHeight;
    },
    placeholderHeight() {
      if (!this.positions.length) return 0;
      return (
        this.positions[this.positions.length - 1].bottom -
          this._listHeaderHeight || 0
      );
    },
  },
  watch: {
    listData: {
      handler() {
        this.initPositions();
        this.setPlaceholderStyle();
        // 更新真实偏移量
        this.setStartOffset();
      },
    },
    itemHeight: {
      handler() {
        this.handleHeightChange()
      },
      deep: true
    },
    sectionHeaderHeight: {
      handler() {
        this.handleHeightChange()
      },
      deep: true
    },
    listHeaderHeight: {
      handler() {
        this.handleHeightChange()
      },
      deep: true
    },
    containerHeight() {
      this.calculateVisibleCounts();
    },
  },
  created() {
    this.registerGenericComponents();
  },
  mounted() {
    this.initPositions();
    this.containerHeight = this.$refs.scrollView?.$el?.clientHeight || 0;
    this.setPlaceholderStyle();
    if (!this.positions || !this.positions.length) {
      return;
    }
    this.start = this.getStartIndex();
    this.end = this.start + this.visibleCount;
    this.setStartOffset();
  },
  methods: {
    handleHeightChange () {
      this.initPositions();
      this.setPlaceholderStyle();
      this.setStartOffset();
      // 外部传值虽然变了，但是未触发 DOM 实际宽高变更，所以也不会自动触发 scrollView 内部 refresh 机制
      // 需要手动触发，让 sticky-header 重新计算位置
      this.$refs.scrollView?.forceUpdateRefreshVersion?.()
    },
    registerGenericComponents() {
      if (!this.generichash || !global.__mpxGenericsMap[this.generichash]) {
        return;
      }

      let components = null;
      const genericList = {
        "recycle-item": this.genericrecycleItem ,
        "list-header": this.genericlistHeader,
        "section-header": this.genericsectionHeader,
        "list-footer": this.genericlistFooter
      }

      for (const key in genericList) {
        const value = genericList[key]
        if (value) {
          components = components || {};
          components[key] = global.__mpxGenericsMap[this.generichash][value]
        }
      }

      if (components) {
        this.$options.components = Object.assign(
          {},
          this.$options.components,
          components
        );
      }
    },
    formatDimension(value) {
      return typeof value === "number" ? `${value}px` : value || "100%";
    },
    setPlaceholderStyle() {
      const infinitePlaceholder = this.$refs.infinitePlaceholder;
      if (infinitePlaceholder) {
        infinitePlaceholder.style.height = `${this.placeholderHeight}px`;
      }
    },
    initPositions() {
      let bottom = this._listHeaderHeight || 0;
      this.positions = this._listData.map((item, index) => {
        const height = this.getItemHeight(
          item.itemData,
          index,
          item.itemData.isSectionHeader ? "sectionHeaderHeight" : "itemHeight"
        );
        const position = {
          index,
          height: height,
          top: bottom,
          bottom: bottom + height,
        };
        bottom = position.bottom;
        return position;
      });

      if (this.containerHeight) {
        this.calculateVisibleCounts();
      }
    },
    calculateVisibleCounts() {
      this.visibleCounts = this.positions.map((_, startIndex) => {
        let count = 0;
        let totalHeight = 0;

        for (let i = startIndex; i < this.positions.length; i++) {
          totalHeight += this.positions[i].height;
          if (totalHeight > this.containerHeight) {
            break;
          }
          count++;
        }

        // 如果是最后几个项目，确保全部显示
        if (startIndex + count > this.positions.length - 3) {
          count = this.positions.length - startIndex;
        }

        return count;
      });
    },

    getStartIndex(scrollTop = 0) {
      // 确保不会返回超出范围的索引
      if (!this.positions.length) {
        return 0;
      }

      // 如果滚动位置为0，直接返回0
      if (scrollTop <= 0) {
        return 0;
      }
      const index = this.binarySearch(this.positions, scrollTop);
      return Math.max(0, Math.min(index, this._listData.length - 1));
    },
    binarySearch(list, value) {
      if (!list.length) return 0;

      // 如果 scrollTop 超过了最后一个元素的底部
      if (value >= list[list.length - 1].bottom) {
        return list.length - 1;
      }

      let start = 0;
      let end = list.length - 1;

      while (start <= end) {
        const midIndex = Math.floor((start + end) / 2);
        const midValue = list[midIndex];

        if (value >= midValue.top && value < midValue.bottom) {
          return midIndex;
        }

        if (value < midValue.top) {
          end = midIndex - 1;
        } else {
          start = midIndex + 1;
        }
      }

      return Math.min(Math.max(0, start - 1), list.length - 1);
    },
    setStartOffset() {
      const infiniteList = this.$refs.infiniteList;
      if (!this.positions.length || !infiniteList) return;
      if (this.start >= 1) {
        // 确保 startIndex 不会超出范围
        const startIndex = Math.min(
          Math.max(0, this.start - this.aboveCount),
          this.positions.length - 1
        );

        const offset = this.positions[startIndex].top;
        infiniteList.style.transform = `translateY(${offset}px)`;
      } else {
        infiniteList.style.transform = `translateY(${this.positions[0].top}px)`;
      }
    },
    getItemHeight(item, index, key) {
      const { value, getter } = this[key];
      if (typeof getter === "function") {
        return getter(item, index) || 0;
      } else {
        return value || 0;
      }
    },
    onScroll(e) {
      const { scrollTop } = e.detail;
      const newStart = this.getStartIndex(scrollTop);

      // 只有当start发生足够变化时才更新，避免滚动触发重渲染
      if (Math.abs(newStart - this.end) >= Math.floor(this.belowCount / 2)) {
        this.start = newStart;
        this.end = this.start + this.visibleCount;
        this.setStartOffset();
      }

      this.$emit("scroll", e);
    },
    onScrolltolower(e) {
      this.$emit("scrolltolower", e);
    },
    onRefresherrefresh(e) {
      this.$emit("refresherrefresh", e);
    },
    scrollToIndex({ index, animated, viewPosition = 0, viewOffset = 0 }) {
      const isStickyHeader = this._listData[index].itemData?.isSectionHeader;
      let prevHeaderHeight = 0;
      // 如果不是sticky header 查找最近一个吸顶的 sticky header
      if (!isStickyHeader && this.enableSticky) {
        for (let i = index - 1; i >= 0; i--) {
          if (this._listData[i].itemData?.isSectionHeader) {
            prevHeaderHeight = this.positions[i].height;
            break;
          }
        }
      }

      const itemTop = (this.positions[index]?.top || 0) - prevHeaderHeight;
      const itemHeight = this.positions[index]?.height || 0;
      const containerHeight = this.containerHeight;

      let targetTop = itemTop;
      if (viewPosition === 1) {
        // 滚动到可视区底部
        targetTop = itemTop - (containerHeight - itemHeight);
      } else if (viewPosition === 0.5) {
        // 滚动到可视区中央
        targetTop = itemTop - (containerHeight - itemHeight) / 2;
      }

      targetTop -= viewOffset;

      this.$refs.scrollView?.bs.scrollTo(0, -targetTop, animated ? 200 : 0);
    },
  },
  components: {
    ScrollView,
    StickyHeader,
  },
};
</script>

<style scoped>
.mpx-recycle-view {
  position: relative;
  overflow: hidden;
  height: 100%;
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
  position: absolute !important;
}
</style>
