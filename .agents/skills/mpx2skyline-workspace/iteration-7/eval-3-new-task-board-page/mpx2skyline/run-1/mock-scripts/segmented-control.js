"use strict";

var _core = require("@mpxjs/core");
(0, _core.createComponent)({
  properties: {
    controlKey: {
      type: String,
      value: ''
    },
    options: {
      type: Array,
      value: []
    },
    value: {
      type: String,
      value: ''
    },
    disabled: {
      type: Boolean,
      value: false
    },
    label: {
      type: String,
      value: '请选择'
    }
  },
  initData: {
    safeOptions: []
  },
  setup(__props, __context) {
    const useContext = () => {
      return __context;
    };
    const props = __props;
    const {
      triggerEvent
    } = useContext();
    const safeOptions = (0, _core.computed)(() => Array.isArray(props.options) ? props.options : []);
    const selectedValue = (0, _core.ref)(props.value);
    const pressedIndex = (0, _core.ref)(-1);
    (0, _core.watch)(() => props.value, value => {
      selectedValue.value = value;
    });
    (0, _core.watch)(() => props.disabled, value => {
      if (value) pressedIndex.value = -1;
    });
    function selectOption(event) {
      const option = safeOptions.value[Number(event.currentTarget.dataset.index)];
      if (props.disabled || !option || option.disabled) return;
      selectedValue.value = option.value;
      pressedIndex.value = -1;
      triggerEvent('change', {
        controlKey: props.controlKey,
        value: option.value
      });
    }
    function pressOption(event) {
      const index = Number(event.currentTarget.dataset.index);
      const option = safeOptions.value[index];
      if (props.disabled || !option || option.disabled) return;
      pressedIndex.value = index;
    }
    function releaseOption() {
      pressedIndex.value = -1;
    }
    return {
      safeOptions,
      selectedValue,
      pressedIndex,
      selectOption,
      pressOption,
      releaseOption
    };
  }
});