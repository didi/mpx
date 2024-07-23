<template>
  <Teleport to="body" v-if="isEnable">
    <div class="root-portal-container">
      <slot></slot>
    </div>
  </Teleport>
  <div v-else>
    <slot></slot>
  </div>
</template>

<script type="text/ecmascript-6">
export default {
  props: {
    enable: Boolean
  },
  watch: {
    enable(val) {
      this.isEnable = val
    }
  },
  data() {
    return {
      isEnable: true
    }
  }
}
</script>
<style lang="stylus" rel="stylesheet/stylus" scoped>
.root-portal-container {
  position: fixed
  z-index: 999
  left: 0
  top: 0
  width: 100%
  height: 100%
}
</style>
