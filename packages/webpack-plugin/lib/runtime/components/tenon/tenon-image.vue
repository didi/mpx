<script>
import { h } from "@hummer/tenon-vue";
import getInnerListeners from "./getInnerListeners";

export default {
  name: "mpx-image",
  props: {
    src: {
      type: String,
    },
    mode: {
      type: String,
      default: "scaleToFill",
    },
    lazyLoad: {
      type: Boolean,
      default: false,
    },
    showMenuByLongpress: {
      type: Boolean,
      default: false,
    },
  },
  render() {
    let resize = "";
    switch (this.mode) {
      case "scaleToFill":
        resize = "stretch";
        break;
      case "aspectFit":
        resize = "contain";
        break;
      case "aspectFill":
        resize = "cover";
        break;
      default:
        resize = "stretch";
    }
    return h("image", {
      class: "mpx-image",
      src: this.src,
      resize,
      ...getInnerListeners(this)
    });
  },
  data() {
    return {};
  },
  pageConfig: {
    canScroll: false,
  },
  methods: {
  },
};
</script>
<style lang="stylus">
.mpx-image
  width 300px
  height 225px
  display inline-block
</style>