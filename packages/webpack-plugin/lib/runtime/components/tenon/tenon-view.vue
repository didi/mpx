<script>
import { h } from "@hummer/tenon-vue";
import getInnerListeners from "./getInnerListeners";

export default {
  name: "mpx-view",
  props: {
    hoverClass: {
      type: String,
      default: "none",
    },
    hoverStopPropagation: {
      type: Boolean,
      default: false,
    },
    hoverStartTime: {
      type: Number,
      default: 50,
    },
    hoverStayTime: {
      type: Number,
      default: 400,
    },
  },
  render() {
    let mergeAfter;
    if (this.hoverClass && this.hoverClass !== "none") {
      mergeAfter = {
        listeners: {
          onTouchstart: this.handleTouchstart,
          onTouchend: this.handleTouchend,
        },
        force: true,
      };
    }
    return h(
      "view",
      {
        class: this.className,
        ...getInnerListeners(this, { mergeAfter }),
      },
      this.$slots.default && this.$slots.default() || ''
    );
  },
  data() {
    return {
      hover: false,
    };
  },
  computed: {
    className() {
      let result = {};
      if (this.hoverClass && this.hoverClass !== "none" && this.hover) {
        result = {
          "mpx-view": true,
          [this.hoverClass]: true,
        };
      } else {
        result = {
          "mpx-view": true,
          [this.hoverClass]: false,
        };
      }
      return result;
    },
  },
  pageConfig: {
    canScroll: false,
  },
  methods: {
    handleTouchstart(e) {
      if (e.__hoverStopPropagation) {
        return;
      }
      e.__hoverStopPropagation = this.hoverStopPropagation;
      clearTimeout(this.startTimer);
      this.startTimer = setTimeout(() => {
        this.hover = true;
      }, this.hoverStartTime);
    },
    handleTouchend() {
      clearTimeout(this.endTimer);
      this.endTimer = setTimeout(() => {
        this.hover = false;
      }, this.hoverStayTime);
    },
  },
};
</script>