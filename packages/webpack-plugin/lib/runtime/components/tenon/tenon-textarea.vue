
<script>
import { h } from "@hummer/tenon-vue";
import getInnerListeners from "./getInnerListeners";

export default {
  name: "mpx-textarea",
  props: {
    name: String,
    value: {
      type: String,
      default: "",
    },
    placeholder: String,
    disabled: Boolean,
    maxlength: {
      type: Number,
      default: 140,
    },
    autoFocus: Boolean,
    focus: Boolean,
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
    placeholderStyle: {
      type: String,
      default: '',
    },
    confirmType: {
      type: String,
      default: 'return',
    }
  },
  computed: {
    originRef() {
      return this.$refs["mpx-textarea"]
    }
  },
  watch: {
    value: function(newVal, oldVal) {
      if(this.originRef && newVal !== this.originRef.value){
        this.originRef.value = newVal;
      }
    }
  },

  render() {
    const data = {
      class: "mpx-textarea",
      ref: "mpx-textarea",
      focus: this.focus,
      value: this.value,
      placeholder: this.placeholder,
      maxLength: this.maxlength,
      disabled: this.disabled,
      returnKeyType: this.confirmType,
      ...getInnerListeners(this),
    };
    return h("textarea", data);
  },
  pageConfig: {
    canScroll: false,
  },
  methods: {},
};
</script>
<style lang="stylus" scoped>
.mpx-textarea
  font inherit
  cursor auto
  width 300hm
  height 150hm
  display block
  position relative
  resize none

</style>