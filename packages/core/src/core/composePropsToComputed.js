import { hasOwn, camelize, findPropConstructor, isPlainObject } from '../helper/utils'

function getPropDefaultValue (context, prop) {
  if (hasOwn(prop, 'type')) {
    const Constructor = findPropConstructor(prop.type)
    return hasOwn(prop, 'value')
      ? typeof prop.value === 'function'
        ? prop.value.call(context)
        : prop.value
      : Constructor()
  }
  if (!isPlainObject(prop)) {
    const Constructor = findPropConstructor(prop)
    if (Constructor) {
      return Constructor()
    }
  }
}

function transferProps (options, rootOptions) {
  const props = Object.assign({}, options.properties || {}, options.props || {})
  Object.keys(props).map(key => {
    Object.assign(rootOptions.computed, {
      [key] () {
        const camelCaseKey = camelize(key)
        let value
        if (this.mpxAttrs) {
          value = this.mpxAttrs[key] || this.mpxAttrs[camelCaseKey]
        }
        if (value === undefined || value === null) {
          value = getPropDefaultValue(this, props[key])
        }
        return value
      }
    })
  })
  delete options.properties
  delete options.props
}

// 运行时组件将 properties 数据转为 computed
export default function composePropsToComputed (type, rootOptions = {}) {
  if (type === 'component' || type === 'page') {
    rootOptions.runtimeComponent = true
    if (!rootOptions.computed) {
      rootOptions.computed = {}
    }

    transferProps(rootOptions, rootOptions)

    rootOptions.properties = {
      mpxAttrs: {
        type: null
      },
      slots: {
        type: null
      }
    }

    if (Array.isArray(rootOptions.mixins)) {
      rootOptions.mixins.forEach(options => transferProps(options, rootOptions))
    }
  }
}
