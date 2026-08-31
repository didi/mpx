<script>
export default {
  name: 'AnalyticsScroll',
  inheritAttrs: false,
  props: {
    scrollY: {
      type: Boolean,
      default: false
    }
  }
}
</script>

<template>
  <!-- eslint-disable vue/no-deprecated-dollar-listeners-api -->
  <div
    class="analytics-scroll"
    :class="{ 'analytics-scroll--y': scrollY }"
    v-bind="$attrs"
    v-on="$listeners"
  >
    <slot />
    <slot name="content" />
  </div>
  <!-- eslint-enable vue/no-deprecated-dollar-listeners-api -->
</template>

<style scoped>
.analytics-scroll {
  position: relative;
  height: 100%;
}

.analytics-scroll--y {
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
}
</style>
