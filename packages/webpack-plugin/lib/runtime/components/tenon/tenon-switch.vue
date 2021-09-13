<script>
import { getCustomEvent } from "./getInnerListeners";
import { h } from "@hummer/tenon-vue";
export default {
  name: "mpx-switch",
  props: {
    name: String,
    type: {
      type: String,
      default: "switch",
    },
    checked: {
      type: Boolean,
      default: false,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    color: {
      type: String,
      default: "#04BE02",
    },
  },
  watch: {
    checked(newVal) {
      this.switchChecked = newVal;
    },
  },
  data() {
    return {
      switchChecked: this.checked,
    };
  },
  render() {
    let children = [];

    const switchElem = h("switch", {
      value: this.switchChecked,
      class: [
        "mpx-switch-label",
        this.switchChecked ? "checked-switch-label" : "uncheck-switch-label",
      ],
    });
    children.push(switchElem);

    // children.push(...(this.$slots.default() || []));
    const data = {
      class: ["mpx-switch-wrap"],
      ref: "switch",
      onClick: (e) => {
        if (this.disabled) {
          return;
        }
        this.switchChecked = !this.switchChecked;
        this.notifyChange();
      },
    };
    return h("view", data, children);
  },
  methods: {
    getValue() {
      return this.switchChecked;
    },
    setValue(value) {
      this.switchChecked = value;
    },
    notifyChange(value) {
      if (value !== undefined) {
        this.setValue(value);
      } else {
        value = this.getValue();
      }
      this.$emit(
        "change",
        getCustomEvent("change", { value }, this.$refs.switch)
      );
    },
  },
};
</script>

<style lang="stylus">
.mpx-switch-wrap
  .mpx-switch-label
    border-radius 16hm
    width 52hm
    height 32hm
    border none

</style>