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
      inject: ['__pageId']
    })
  }

  return mixin
}
