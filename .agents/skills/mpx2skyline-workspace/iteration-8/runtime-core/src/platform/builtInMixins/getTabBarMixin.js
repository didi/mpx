// web专用mixin，在web中实现getTabBar功能
import { CREATED } from '../../core/innerLifecycle'

export default function getTabBarMixin (mixinType) {
  if (mixinType === 'page') {
    return {
      [CREATED] () {
        if (this.$parent && this.$parent.$vnode && this.$parent.$vnode.tag && this.$parent.$vnode.tag.endsWith('mpx-tab-bar-container')) {
          this.getTabBar = () => {
            return this.$parent.$refs.tabBar
          }
        }
      }
    }
  }
}
