
<script>
import { h } from "@hummer/tenon-vue";
import getInnerListeners from "./getInnerListeners";

export default {
  name: "mpx-text",
  props: {
    selectable: {
      type: Boolean,
      default: false,
    },
    space: {
      type: String,
    },
    decode: {
      type: Boolean,
      default: false,
    },
  },
  render() {
    let text = "";
    let classNames = ["mpx-text"];
    const nodes = this.$slots.default();
    nodes.forEach((item) => {
      if (item.shapeFlag === 8 && item.children) {
        text += item.children;
      }
    });
    // hummer不支持 暂时注释
    // switch (this.space) {
    //   case "ensp":
    //   case "emsp":
    //   case "nbsp":
    //     text = text.replace(/ /g, `&${this.space};`);
    //     break;
    // }
    return h(
      "text",
      {
        class: classNames,
        ...getInnerListeners(this),
      },
      text
    );
  },
  data() {
    return {};
  },
  beforeCreate() {},
  pageConfig: {
    canScroll: false,
  },
  methods: {
  },
};
</script>
<style lang="stylus">
.mpx-text
  user-select none
  &.selectable
    user-select text

</style>