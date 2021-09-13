<script>
import { h } from "@hummer/tenon-vue";
import getInnerListeners from "./getInnerListeners";
export default {
  name: "mpx-input",
  props: {
    name: String,
    value: {
      type: String,
      default: "",
    },
    type: {
      type: String,
      default: "text",
    },
    password: Boolean,
    placeholder: String,
    disabled: Boolean,
    maxlength: {
      type: Number,
      default: 140,
    },
    autoFocus: Boolean,
    focus: {
      type: Boolean,
      default: false,
    },
    cursor: {
      type: Number,
      default: -1,
    },
    selectionStart: {
      type: Number,
      default: -1,
    },
    selectionEnd: {
      type: Number,
      default: -1,
    },
  },
  render() {
    let inputType = "";
    if (this.password) {
      inputType = "password";
    } else {
      switch (this.type) {
        case "text":
          inputType = "default";
          break;
        case "number":
          inputType = "number";
          break;
        default:
          inputType = "text";
      }
    }

    const data = {
      class: "mpx-input",
      value: this.value,
      focus: this.focus,
      placeholder: this.placeholder,
      maxLength: this.maxLength,
      type: inputType,
      disabled: this.disabled,
      ...getInnerListeners(this),
    };
    return h("input", data, []);
    // return '123'
  },
  data() {
    return {};
  },
  pageConfig: {
    canScroll: false,
  },
  methods: {},
};
</script>
<style lang="stylus">
  .mpx-input
    cursor auto
    width 100%
    padding 0
    border 0
    font inherit
    display block
    height 1.4rem
    text-overflow clip
    overflow hidden
    white-space nowrap
    font-family UICTFontTextStyleBody
    min-height 1.4rem

</style>