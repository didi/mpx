<template>
  <div
    class="analytics-scroll"
    :style="scrollStyle"
    v-bind="$attrs"
    v-on="$listeners"
  >
    <slot />
  </div>
</template>

<script>
export default {
  name: 'AnalyticsScroll',
  inheritAttrs: false,
  props: {
    scrollX: Boolean,
    scrollY: Boolean,
    scrollTop: {
      type: Number,
      default: 0
    },
    scrollLeft: {
      type: Number,
      default: 0
    }
  },
  computed: {
    scrollStyle () {
      return {
        overflowX: this.scrollX ? 'auto' : 'hidden',
        overflowY: this.scrollY ? 'auto' : 'hidden'
      }
    }
  },
  watch: {
    scrollTop (value) {
      this.$el.scrollTop = value
    },
    scrollLeft (value) {
      this.$el.scrollLeft = value
    }
  },
  mounted () {
    this.$el.scrollTop = this.scrollTop
    this.$el.scrollLeft = this.scrollLeft
  }
}
</script>
