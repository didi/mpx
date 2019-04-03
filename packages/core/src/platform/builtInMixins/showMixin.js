export default function pageStatusMixin (mixinType) {
  if (mixinType === 'component') {
    return {
      properties: {
        'mpxShow': {
          type: Boolean,
          value: true
        }
      }
    }
  }
}
