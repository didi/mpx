<template>
  <div ref="viewport" v-bind="$attrs" class="analytics-scroll" :style="viewportStyle" v-on="passthroughListeners" @scroll="handleNativeScroll">
    <div ref="content" class="analytics-scroll__content">
      <slot />
      <slot name="content" />
    </div>
  </div>
</template>

<script>
export default {
  name: 'AnalyticsScroll',
  inheritAttrs: false,
  props: {
    scrollX: Boolean, scrollY: Boolean,
    scrollTop: { type: Number, default: 0 }, scrollLeft: { type: Number, default: 0 },
    scrollIntoView: { type: String, default: '' },
    upperThreshold: { type: Number, default: 50 }, lowerThreshold: { type: Number, default: 50 },
    scrollWithAnimation: Boolean
  },
  data () { return { lastTop: 0, lastLeft: 0, nearUpper: false, nearLower: false, resizeObserver: null, mutationObserver: null, observerActive: false } },
  computed: {
    viewportStyle () { return { overflowX: this.scrollX ? 'auto' : 'hidden', overflowY: this.scrollY ? 'auto' : 'hidden' } },
    passthroughListeners () {
      const listeners = Object.assign({}, this.$listeners)
      delete listeners.scroll; delete listeners.scrolltoupper; delete listeners.scrolltolower
      return listeners
    }
  },
  mounted () {
    this.observerActive = true
    this.syncPosition(); this.scrollToView()
    const refresh = () => {
      if (!this.observerActive || this._isBeingDestroyed || this._isDestroyed) return
      this.$nextTick(() => { if (this.observerActive && !this._isDestroyed) this.refresh() })
    }
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(refresh)
      this.resizeObserver.observe(this.$refs.viewport); this.resizeObserver.observe(this.$refs.content)
    }
    if (typeof MutationObserver !== 'undefined') {
      this.mutationObserver = new MutationObserver(refresh)
      this.mutationObserver.observe(this.$refs.content, { childList: true, subtree: true, attributes: true })
    }
  },
  watch: {
    scrollTop () { this.syncPosition() }, scrollLeft () { this.syncPosition() },
    scrollIntoView () { this.$nextTick(() => this.scrollToView()) }
  },
  methods: {
    syncPosition () {
      const node = this.$refs.viewport; if (!node) return
      node.scrollTop = Number(this.scrollTop) || 0; node.scrollLeft = Number(this.scrollLeft) || 0
      this.lastTop = node.scrollTop; this.lastLeft = node.scrollLeft
    },
    refresh () { if (this.$refs.viewport) this.$refs.viewport.scrollTop = this.$refs.viewport.scrollTop },
    scrollToView () {
      const node = this.$refs.viewport; if (!node || !this.scrollIntoView) return
      const target = Array.from(this.$refs.content.querySelectorAll('[id]')).find((item) => item.id === this.scrollIntoView)
      if (!target) return
      const vr = node.getBoundingClientRect(); const tr = target.getBoundingClientRect()
      node.scrollTo({ top: node.scrollTop + tr.top - vr.top, left: node.scrollLeft + tr.left - vr.left, behavior: this.scrollWithAnimation ? 'smooth' : 'auto' })
    },
    detail (event) {
      const node = event.target
      return { scrollTop: node.scrollTop, scrollLeft: node.scrollLeft, scrollHeight: node.scrollHeight, scrollWidth: node.scrollWidth, deltaX: node.scrollLeft - this.lastLeft, deltaY: node.scrollTop - this.lastTop }
    },
    handleNativeScroll (event) {
      const node = event.target; const detail = this.detail(event)
      const top = node.scrollTop <= this.upperThreshold; const left = node.scrollLeft <= this.upperThreshold
      const bottom = node.scrollHeight - node.clientHeight - node.scrollTop <= this.lowerThreshold
      const right = node.scrollWidth - node.clientWidth - node.scrollLeft <= this.lowerThreshold
      this.$emit('scroll', detail)
      if ((this.scrollY && top) || (this.scrollX && left)) { if (!this.nearUpper) this.$emit('scrolltoupper', detail); this.nearUpper = true } else this.nearUpper = false
      if ((this.scrollY && bottom) || (this.scrollX && right)) { if (!this.nearLower) this.$emit('scrolltolower', detail); this.nearLower = true } else this.nearLower = false
      this.lastTop = node.scrollTop; this.lastLeft = node.scrollLeft
    }
  },
  beforeDestroy () {
    this.observerActive = false
    if (this.resizeObserver) this.resizeObserver.disconnect(); if (this.mutationObserver) this.mutationObserver.disconnect()
    this.resizeObserver = null; this.mutationObserver = null
  }
}
</script>

<style>
.analytics-scroll { position: relative; width: 100%; height: 100%; }
.analytics-scroll__content { min-width: max-content; min-height: max-content; }
</style>
