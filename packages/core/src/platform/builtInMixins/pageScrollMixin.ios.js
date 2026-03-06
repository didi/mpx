import { warn } from '@mpxjs/utils'
import { CREATED } from '../../core/innerLifecycle'

/**
 * React Native 页面滚动 Mixin
 * 提供页面级别的 pageScrollTo 方法
 * 使用该功能需在页面的 scroll-view 组件上声明 wx:ref="pageScrollView"
 */
export default function pageScrollMixin (mixinType) {
  if (mixinType !== 'page') {
    return
  }

  return {
    [CREATED] () {
      this.__registerPageScrollTo()
    },
    beforeUnmount () {
      const navigation = this.__props?.navigation
      if (navigation && navigation.pageScrollTo) {
        delete navigation.pageScrollTo
      }
    },
    methods: {
      /**
       * 注册 pageScrollTo 方法到 navigation 对象
       */
      __registerPageScrollTo () {
        const navigation = this.__props?.navigation

        // navigation.pageScrollTo 不存在时才注册，避免重复
        if (navigation && !navigation.pageScrollTo) {
          navigation.pageScrollTo = (options) => {
            this.__pageScrollTo(options)
          }
        }
      },

      /**
       * 获取页面滚动视图节点（通过固定 ref 名称 pageScrollView）
       * @returns {Object|null} 滚动视图的节点实例
       */
      __findScrollableNode () {
        const ref = this.__refs?.pageScrollView?.[0]
        if (!ref || ref.type !== 'node' || !ref.instance?.getNodeInstance) return null
        return ref.instance.getNodeInstance()
      },

      /**
       * 页面滚动到指定位置
       * @param {Object} options - 配置选项
       * @param {number} options.scrollTop - 滚动到页面的目标位置（单位 px）
       * @param {number} options.duration - 滚动动画的时长（单位 ms）
       * @param {string} options.selector - 选择器
       * @param {number} options.offsetTop - 偏移距离
       * @param {Function} options.onSuccess - 成功回调
       * @param {Function} options.onFail - 失败回调
       */
      __pageScrollTo (options = {}) {
        const {
          scrollTop,
          duration = 300,
          selector,
          offsetTop = 0,
          onSuccess,
          onFail
        } = options

        try {
          const nodeInstance = this.__findScrollableNode()

          if (nodeInstance) {
            this.__executeScroll(nodeInstance, scrollTop, duration, selector, offsetTop, onSuccess, onFail)
            return
          }

          // 没找到可滚动视图
          const errMsg = 'pageScrollTo:fail scrollable view not found. Please add wx:ref="pageScrollView" to the scroll-view component in your page'
          warn(errMsg)
          onFail && onFail(errMsg)
        } catch (e) {
          const errMsg = `pageScrollTo:fail ${e.message}`
          warn(errMsg)
          onFail && onFail(errMsg)
        }
      },

      /**
       * 执行滚动操作
       */
      __executeScroll (scrollViewNodeInstance, scrollTop, duration, selector, offsetTop, onSuccess, onFail) {
        try {
          const scrollViewNode = scrollViewNodeInstance.instance.node

          // 如果提供了 selector，使用 scrollIntoView
          if (selector) {
            if (scrollViewNode.scrollIntoView) {
              // 将页面的 __selectRef 传递给 scrollIntoView
              scrollViewNode.scrollIntoView(selector, {
                offset: offsetTop,
                animated: duration > 0,
                duration,
                __selectRef: this.__selectRef, // 传递页面的 __selectRef 方法
                scrollViewNativeRef: scrollViewNodeInstance.nodeRef?.current // 传递 scroll-view 的原生引用
              })
              onSuccess && onSuccess()
            } else {
              const errMsg = 'pageScrollTo:fail scrollIntoView method not available'
              warn(errMsg)
              onFail && onFail(errMsg)
            }
            return
          }

          // 使用 scrollTop 进行滚动
          if (scrollTop !== undefined) {
            if (scrollViewNode.scrollTo) {
              scrollViewNode.scrollTo({
                top: scrollTop,
                left: 0,
                animated: duration > 0,
                duration
              })
              onSuccess && onSuccess()
            } else {
              const errMsg = 'pageScrollTo:fail scrollTo method not available'
              warn(errMsg)
              onFail && onFail(errMsg)
            }
            return
          }

          // 既没有 scrollTop 也没有 selector
          const errMsg = 'pageScrollTo:fail scrollTop or selector is required'
          warn(errMsg)
          onFail && onFail(errMsg)
        } catch (e) {
          const errMsg = `pageScrollTo:fail ${e.message}`
          warn(errMsg)
          onFail && onFail(errMsg)
        }
      }
    }
  }
}
