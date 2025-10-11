let pageId = 0

export default function pageIdMixin (mixinType) {
  const mixin = {}

  if (mixinType === 'page') {
    Object.assign(mixin, {
      beforeCreate () {
        this.__pageId = ++pageId
      },
      provide () {
        return {
          __pageId: this.__pageId
        }
      }
    })
  }

  if (mixinType === 'component') {
    Object.assign(mixin, {
      inject: {
        // 从父级 page provide 的 pageId（普通组件）
        __pageId: {
          from: '__pageId',
          default: undefined
        },
        // 从 TabBarContainer 等容器 provide 的 pageId（custom-tab-bar）
        __tabContainerPageId: {
          from: '__tabContainerPageId',
          default: null
        }
      }
    })
  }

  return mixin
}
