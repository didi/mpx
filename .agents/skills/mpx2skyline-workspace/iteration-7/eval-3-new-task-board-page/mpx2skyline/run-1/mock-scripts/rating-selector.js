"use strict";

var _core = require("@mpxjs/core");
(0, _core.createComponent)({
  properties: {
    ratingKey: {
      type: String,
      value: ''
    },
    value: {
      type: Number,
      value: 0
    },
    max: {
      type: Number,
      value: 5
    },
    readonly: {
      type: Boolean,
      value: false
    },
    label: {
      type: String,
      value: '请评分'
    }
  },
  initData: {
    stars: []
  },
  data: {
    currentValue: 0,
    pressedValue: 0
  },
  computed: {
    stars() {
      return Array.from({
        length: this.max
      }, (_, index) => index + 1);
    }
  },
  watch: {
    value: {
      immediate: true,
      handler(value) {
        this.currentValue = value;
      }
    },
    readonly(value) {
      if (value) this.pressedValue = 0;
    }
  },
  methods: {
    selectRating(event) {
      if (this.readonly) return;
      this.currentValue = Number(event.currentTarget.dataset.value);
      this.pressedValue = 0;
      this.triggerEvent('change', {
        ratingKey: this.ratingKey,
        value: this.currentValue
      });
    },
    pressStar(event) {
      if (this.readonly) return;
      this.pressedValue = Number(event.currentTarget.dataset.value);
    },
    releaseStar() {
      this.pressedValue = 0;
    }
  }
});