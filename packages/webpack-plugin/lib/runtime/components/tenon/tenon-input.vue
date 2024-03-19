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
    style: {
      type: String,
      default: '',
    },
    placeholderStyle: {
      type: String,
      default: '',
    },
    confirmType: {
      type: String,
      default: 'done',
    }
  },
  computed: {
    originRef() {
      return this.$refs["mpx-input"]
    },
    computedStyle() {
      let _inputWrapStyleObj = {
        "font-size": "33hm",
        height: "80hm",
        "line-height": "80hm",
        color: "#000000",
        border: "1hm solid #999999",
        "border-radius": "8hm",
        "text-align": "left",
        "background-color": "#ffffff"
      };

      if (typeof this.style !== 'string') {
        console.warn('Runtime warning: PROPS style must be string')
      }

      let _styleObj = {};

      if (typeof this.style === 'string') {
        let _style = this.style;

        if (_style[_style.length - 1] !== ";") {
          _style += ";";
        }

        _style.split(";").map(item => {
          if (item) {
            let itemArray = item.split(":");
            _styleObj[itemArray[0]] = itemArray[1];
          }
        });
      }
      
      //HACK: tenon会存在读到this.style为封装标签的样式 @曹恩泽
      if (typeof this.style === 'object') {
        _styleObj = Object.assign({}, _styleObj, this.style)
      }

      let styleObj = Object.assign({}, _inputWrapStyleObj, _styleObj);
      let style = Object.keys(styleObj)
        .map(k => `${k}:${styleObj[k]}`)
        .join(";");

      //Tenon变更placeholderColor
      const regex = /color/i
      style += this.placeholderStyle.replace(regex, 'placeholderColor');
      return style;
    },
  },
  watch: {
    value: function (newVal, oldVal) {
      console.log(newVal)
      if (this.originRef && newVal !== this.originRef.value) {
        this.originRef.value = newVal;
      }
    }
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
        case "tel":
          inputType = "tel";
          break;
        default:
          inputType = "text";
      }
    }

    const data = {
      class: "mpx-input",
      focused: this.focus,
      ref: "mpx-input",
      placeholder: this.placeholder,
      maxLength: this.maxlength,
      type: inputType,
      disabled: this.disabled,
      style: this.computedStyle,
      returnKeyType: this.confirmType,
      ...getInnerListeners(this, { _input: true }),
    };
    return h("input", data, []);
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
<style lang="stylus" scoped>
  .mpx-input
    cursor auto
    width 100%
    padding 0
    border 0
    font inherit
    display block
    text-overflow clip
    overflow hidden
    white-space nowrap
    font-family UICTFontTextStyleBody

</style>