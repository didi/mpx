<template>
  <div
    ref="scroller"
    class="analytics-scroll"
    v-bind="$attrs"
    v-on="$listeners"
  >
    <slot />
  </div>
</template>

<script>
export default {
  name: 'AnalyticsScroll',
  inheritAttrs: false
}
</script>

<style scoped>
.analytics-scroll {
  overflow: hidden;
  -webkit-overflow-scrolling: touch;
}

.analytics-scroll[scroll-y] {
  overflow-y: auto;
}

.analytics-scroll[scroll-x] {
  overflow-x: auto;
}
</style>
