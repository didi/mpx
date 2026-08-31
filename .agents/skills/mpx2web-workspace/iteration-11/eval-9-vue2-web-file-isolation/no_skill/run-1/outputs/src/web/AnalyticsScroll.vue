<template>
  <div
    ref="scroll"
    class="analytics-scroll"
    :class="{
      'analytics-scroll--y': scrollY,
      'analytics-scroll--x': scrollX
    }"
    v-bind="$attrs"
    v-on="$listeners"
  >
    <slot />
    <slot name="content" />
  </div>
</template>

<script>
export default {
  name: 'AnalyticsScroll',
  inheritAttrs: false,
  props: {
    scrollY: {
      type: Boolean,
      default: false
    },
    scrollX: {
      type: Boolean,
      default: false
    }
  }
}
</script>

<style scoped>
.analytics-scroll {
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
}

.analytics-scroll--y {
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}

.analytics-scroll--x {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}
</style>
