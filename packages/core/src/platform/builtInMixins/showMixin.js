export default function pageStatusMixin (mixinType) {
  if (mixinType === 'component') {
    if (__mpx_mode__ === 'ali') {
      return {
        props: {
          mpxShow: true
        }
      }
    } else {
      return {
        properties: {
          mpxShow: {
            type: Boolean,
            value: true
          }
        }
      }
    }
  }
}
