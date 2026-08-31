<template>
  <div
    class="analytics-scroll"
    :class="{ 'analytics-scroll--y': scrollY }"
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
    scrollY: Boolean
  }
}
</script>

<style scoped>
.analytics-scroll--y {
  height: 100%;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}
</style>
