export default function optionsMixin (mixinType) {
  if (__mpx_mode__ === 'ali' && mixinType === 'component') {
    return {
      options: {
        externalClasses: true
      }
    }
  }
  return {}
}
