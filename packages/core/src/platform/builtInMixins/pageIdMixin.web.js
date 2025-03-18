let pageId = 0

export default function pageIdMixin (mixinType) {
  const mixin = {}

  if (mixinType === 'page') {
    Object.assign(mixin, {
      provide: {
       __pageId: ++pageId
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
