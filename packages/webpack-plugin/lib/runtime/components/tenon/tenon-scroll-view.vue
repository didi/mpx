<script>
import getInnerListeners, { getCustomEvent } from "./getInnerListeners";
import { processSize } from "./util";
import { h } from "@hummer/tenon-vue";
export default {
  name: "mpx-scroll-view",
  props: {
    // 允许横向滚动
    scrollX: Boolean,
    // 允许纵向滚动
    scrollY: Boolean,
    // 距顶部/左边多远时，触发 scrolltoupper 事件
    upperThreshold: {
      type: [Number, String],
      default: 50,
    },
    // 距底部/右边多远时，触发 scrolltolower 事件
    lowerThreshold: {
      type: [Number, String],
      default: 50,
    },
    // 设置竖向滚动条位置
    scrollTop: {
      type: [Number, String],
      default: 0,
    },
    // 设置横向滚动条位置
    scrollLeft: {
      type: [Number, String],
      default: 0,
    },
    scrollOptions: Object,
    // 更新refresh
    updateRefresh: {
      type: Boolean,
      default: true,
    },
    // 值应为某子元素id（id不能以数字开头）。设置哪个方向可滚动，则在哪个方向滚动到该元素
    scrollIntoView: String,
    // 在设置滚动条位置时使用动画过渡
    scrollWithAnimation: Boolean,
    // 启用 flexbox 布局。开启后，当前节点声明了 display: flex 就会成为 flex container，并作用于其孩子节点。
    enableFlex: Boolean,
    // 启用 scroll-view 增强特性，启用后可通过 ScrollViewContext 操作 scroll-view
    enhanced: Boolean,
    // 开启自定义下拉刷新
    refresherEnabled: Boolean,
    // 设置当前下拉刷新状态，true 表示下拉刷新已经被触发，false 表示下拉刷新未被触发
    refresherTriggered: Boolean,
    // 设置自定义下拉刷新阈值
    refresherThreshold: {
      type: Number,
      default: 45,
    },
    // 设置自定义下拉刷新默认样式，支持设置 black | white | none， none 表示不使用默认样式
    refresherDefaultStyle: {
      type: String,
      default: "black",
    },
    // 设置自定义下拉刷新区域背景颜色
    refresherBackground: {
      type: String,
      default: "",
    },
  },
  data() {
    return {};
  },
  computed: {
    _scrollTop() {
      // return 1
      return processSize(this.scrollTop);
    },
    _scrollLeft() {
      // return 1
      return processSize(this.scrollLeft);
    },
  },
  mounted() {
    if (this.scrollTop) {
      setTimeout(() => {
        this.$refs.scroll && this.$refs.scroll.scrollTo(0, this._scrollTop);
      }, 100);
    
    }
    if (this.scrollLeft) {
      setTimeout(() => {
        this.$refs.scroll && this.$refs.scroll.scrollTo(this._scrollLeft, 0);
      }, 100);
    }
  },
  watch: {
    _scrollTop(val) {
      console.log('触发')
      this.$refs.scroll && this.$refs.scroll.scrollTo(0, val);
    },
    _scrollLeft(val) {
      this.$refs.scroll && this.$refs.scroll.scrollTo(val, 0);
    },
  },
  methods: {},
  render() {
    let scrollDirection = "vertical";
    if (!this.scrollY && this.scrollX) {
      scrollDirection = "horizontal";
    }
    return h(
      "scroller",
      {
        ref: "scroll",
        scrollDirection,
        showScrollBar: true,
      },
      this.$slots.default()
    );
  },
};
</script>
