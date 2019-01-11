import {
  comparer
} from 'mobx'

import MPXProxy from '../../../core/proxy'

function transformApiForProxy (context) {
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
}

export function getDefaultOptions (type, { rawOptions = {} }) {
  const hookNames = type === 'component' ? ['didMount', 'didUnmount'] : ['onLoad', 'onUnload']
  let extraOptions = {}
  if (type === 'page') {
    Object.assign(extraOptions, rawOptions.methods)
  } else {
    extraOptions = {
      methods: rawOptions.methods,
      props: rawOptions.props
    }
  }
  return {
    ...extraOptions,
    [hookNames[0]] () {
      // 提供代理对象需要的api
      transformApiForProxy(this)
      // 缓存options
      this.$rawOptions = rawOptions
      // 创建proxy对象
      const mpxProxy = new MPXProxy(rawOptions, this)
      this.$mpxProxy = mpxProxy
      this.$mpxProxy.created()
    },
    didUpdate (prevProps) {
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
  }
}
