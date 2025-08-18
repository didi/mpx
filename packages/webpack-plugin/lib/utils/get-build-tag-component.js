const normalize = require('./normalize')
const { isBuildInWebTag, isBuildInReactTag } = require('./dom-tag-config')

module.exports = function getBuildTagComponent (mode, tag) {
  const aliBuildTag = ['view', 'text'].reduce((obj, name) => {
    obj[name] = {
      name: `mpx-${name}`,
      resource: normalize.lib(`runtime/components/ali/mpx-${name}.mpx`)
    }
    return obj
  }, {})

  switch (mode) {
    case 'ali':
      return aliBuildTag[tag]
    case 'web':
      if (isBuildInWebTag(`mpx-${tag}`)) {
        return {
          name: `mpx-${tag}`,
          resource: normalize.lib(`runtime/components/web/mpx-${tag}.vue`)
        }
      }
      return undefined
    case 'ios':
    case 'android':
    case 'harmony':
      if (isBuildInReactTag(`mpx-${tag}`)) {
        return {
          name: `mpx-${tag}`,
          resource: normalize.lib(`runtime/components/react/dist/mpx-${tag}.jsx`)
        }
      }
      return undefined
  }
}
