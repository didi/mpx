<template>
  <div
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
  inheritAttrs: false,
  props: {
    scrollY: Boolean,
    scrollX: Boolean
  }
}
</script>

<style scoped>
.analytics-scroll {
  overflow: hidden;
}

.analytics-scroll--y {
  overflow-y: auto;
}

.analytics-scroll--x {
  overflow-x: auto;
}
</style>
