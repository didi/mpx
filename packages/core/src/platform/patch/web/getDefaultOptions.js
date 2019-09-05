import customKey from '../customOptionKeys'
import mergeOptions from '../../../core/mergeOptions'

function filterOptions (options) {
  const newOptions = {}
  const ignoreProps = customKey
  Object.keys(options).forEach(key => {
    if (ignoreProps.indexOf(key) !== -1 || (key === 'data' && typeof options[key] === 'function')) {
      return
    }
    newOptions[key] = options[key]
  })
  return newOptions
}

export function getDefaultOptions (type, { rawOptions = {} }) {
  const rootMixins = []
  rawOptions.mixins = rawOptions.mixins ? rootMixins.concat(rawOptions.mixins) : rootMixins
  rawOptions = mergeOptions(rawOptions, type, false)
  return filterOptions(rawOptions)
}
