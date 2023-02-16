import { trackAggregateEvent } from '../js/Omega'
import { isWebBundle } from '../js/env'
// 处理自定义组件显示在 viewport 的埋点
export default {
  data: {
    triggered: false
  },
  lifetimes: {
    attached () {
      if (isWebBundle) return
      this.intersectionInstance = this.createIntersectionObserver({
        thresholds: [0.5]
      }).relativeToViewport().observe('.intersectionRootNode', () => {
        // 只触发一次
        if (this.triggered) return
        this.triggered = true
        trackAggregateEvent(this.intersectionEventId, this.intersectionOmegaParams || {})
        this.exposureH5 && this.exposureH5() // 一些其他的埋点
      })
    },
    detached () {
      if (this.intersectionInstance) {
        this.intersectionInstance.disconnect()
        this.triggered = false
      }
    }
  }
}
