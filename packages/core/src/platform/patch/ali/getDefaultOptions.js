import {
  comparer
} from 'mobx'

import MPXProxy from '../../../core/proxy'
import customeKey from '../../../core/customOptionKeys'
import mergeOptions from '../../../core/mergeOptions'

function transformApiForProxy (context, currentInject) {
  const rawSetData = context.setData.bind(context)
  Object.defineProperties(context, {
    __getInitialData: {
      get () {
        return () => Object.assign({}, context.props, context.data)
      },
      configurable: false
    },
    __render: {
      get () {
        return rawSetData
      },
      configurable: false
    }
  })
  if (currentInject) {
    if (currentInject.render) {
      Object.defineProperties(context, {
        __injectedRender: {
          get () {
            return currentInject.render.bind(context)
          },
          configurable: false
        }
      })
    }
    if (currentInject.getRefsData) {
      Object.defineProperties(context, {
        __getRefsData: {
          get () {
            return currentInject.getRefsData
          },
          configurable: false
        }
      })
    }
  }
}

function filterOptions (options, type) {
  const newOptions = {}
  const ignoreProps = customeKey.concat(['data'])
  Object.keys(options).forEach(key => {
    if (ignoreProps.indexOf(key) !== -1) {
      return
    }
    if (key === 'properties' || key === 'props') {
      newOptions['props'] = Object.assign({}, options['properties'], options['props'])
    } else if (key === 'methods' && type === 'page') {
      Object.assign(newOptions, options[key])
    } else {
      newOptions[key] = options[key]
    }
  })
  return newOptions
}

export function getDefaultOptions (type, { rawOptions = {}, currentInject }) {
  const hookNames = type === 'component' ? ['onInit', 'didUnmount'] : ['onLoad', 'onUnload']
  const options = filterOptions(rawOptions, type)
  options.mixins = [{
    [hookNames[0]] () {
      // 提供代理对象需要的api
      transformApiForProxy(this, currentInject)
      // 缓存options
      this.$rawOptions = rawOptions
      // 创建proxy对象
      const mpxProxy = new MPXProxy(rawOptions, this)
      this.$mpxProxy = mpxProxy
      this.$mpxProxy.created()
    },
    didUpdate (prevProps) {
      // mounted之前的变更不需要触发updated
      if (!this.$mpxProxy || !this.$mpxProxy.isMounted()) {
        return '__abort__'
      }
      if (prevProps && prevProps !== this.props) {
        let isChanged = false
        Object.keys(prevProps).forEach(key => {
          if (!comparer.structural(this.props[key], prevProps[key])) {
            this[key] = this.props[key]
            isChanged = true
          }
        })
        if (isChanged) {
          this.$mpxProxy.updated()
        }
      }
    },
    [hookNames[1]] () {
      this.$mpxProxy.destroyed()
    }
  }]
  return mergeOptions(options, type, false)
}
