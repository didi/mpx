import { BEFORECREATE } from '../../core/innerLifecycle'
import { noop, isBoolean, dash2hump, warn, collectDataset, hump2dash } from '@mpxjs/utils'
import { StyleSheet } from 'react-native'

const _createSelectorQuery = (runCb) => {
  return {
    exec: (cb = noop) => {
      runCb().then(res => {
        cb(res)
      })
    },
    in: () => {
      warn('please use wx:ref to get NodesRef')
    },
    select: () => {
      warn('please use wx:ref to get NodesRef')
    },
    selectAll: () => {
      warn('please use wx:ref to get NodesRef')
    },
    selectViewport: () => { // 有点难实现，dimension 目前没有暴露相关 api
      warn('please use wx:ref')
    }
  }
}

const flushRefFns = (nodeInstances, fns) => {
  const mountedNodeInstance = nodeInstances
    .map(instance => instance.getNodeInstance())
    .filter(({ nodeRef }) => nodeRef.current) // 如果有 nodeRef，表明目前组件处于挂载中
  if (mountedNodeInstance.length) {
    return Promise.all(mountedNodeInstance.map(instance => flushFns(instance, fns)))
  } else {
    return Promise.resolve(null)
  }
}

const flushFns = (nodeInstance, fns) => {
  return Promise.all(fns.map(fn => fn(nodeInstance))).then((res) => {
    return res.reduce((preVal, curVal) => {
      return Object.assign(preVal, curVal)
    }, {})
  })
}

const wrapFn = (fn) => {
  return (nodeRef) => {
    return new Promise((resolve) => {
      fn(nodeRef, resolve)
    })
  }
}

const getMeasureProps = (measureProps = []) => {
  return wrapFn((nodeInstance, resolve) => {
    const nodeRef = nodeInstance.nodeRef.current
    setTimeout(() => {
      nodeRef.measure(function (x, y, width, height, pageX, pageY) {
        const rectAndSize = {
          width,
          height,
          left: pageX,
          top: pageY,
          right: pageX + width,
          bottom: pageY + height
        }
        const result = measureProps.reduce((preVal, key) => {
          return Object.assign(preVal, { [key]: rectAndSize[key] || 0 })
        }, {})
        resolve(result)
      })
    }, 30)
  })
}

const getDataset = (props) => {
  return wrapFn((nodeRef, resolve) => {
    props = nodeRef.props.current
    resolve({
      dataset: collectDataset(props)
    })
  })
}

const getPlainProps = (config) => {
  return wrapFn((nodeRef, resolve) => {
    const res = {}
    const props = nodeRef.props.current
    config.forEach((key) => {
      // props 属性默认不转驼峰，用户写什么格式不会变化，取值做兼容
      res[key] = props[key] || props[hump2dash(key)] || ''
    })
    resolve(res)
  })
}

const getComputedStyle = (config = []) => {
  return wrapFn((nodeRef, resolve) => {
    config = new Set(config)
    const res = {}
    const styles = nodeRef.props.current.style || []
    const defaultStyle = nodeRef.instance.defaultStyle || {}
    const computedStyle = StyleSheet.flatten([defaultStyle, ...styles])
    config.forEach((key) => {
      const humpKey = dash2hump(key)
      // 取 style 的 key 是根据传入的 key 来设置，传什么设置什么 key，只不过取值需要做兼容
      res[key] = computedStyle[key] || computedStyle[humpKey] || ''
    })

    resolve(res)
  })
}

const getInstanceConfig = (config) => {
  return wrapFn((nodeRef, resolve) => {
    const instance = nodeRef.instance
    resolve({ [config]: instance[config] || {} })
  })
}

const defaultScrollOffset = {
  scrollLeft: 0,
  scrollTop: 0,
  scrollHeight: 0,
  scrollWidth: 0
}

const getScrollOffset = () => {
  return wrapFn((nodeRef, resolve) => {
    const instance = nodeRef.instance
    resolve((instance.scrollOffset && instance.scrollOffset.current) || defaultScrollOffset)
  })
}

// const getScrollOffsetFallback = (cb) => {
//   const res = {
//     scrollLeft: 0,
//     scrollTop: 0,
//     scrollHeight: 0,
//     scrollWidth: 0
//   }
//   cb(res)
// }

const RECT = ['left', 'top', 'right', 'bottom']
const SIZE = ['width', 'height']

function _createNodesRef (nodeRefs = []) {
  const fields = (config, cb = noop) => {
    const plainProps = []
    const measureProps = []
    const computedStyle = []
    const fns = []

    for (const key in config) {
      const value = config[key]
      if (Array.isArray(value) && value.length) {
        if (key === 'properties') {
          // wx 最终输出的 properties 字段都会转化为驼峰，所以在这里提前处理为最终的字段格式
          plainProps.push(...value.map(v => dash2hump(v)))
        } else if (key === 'computedStyle') {
          const _computedStyle = config.computedStyle
          for (let i = _computedStyle.length - 1; i >= 0; i--) {
            const style = _computedStyle[i]
            if (RECT.includes(style) || SIZE.includes(style)) {
              measureProps.push(style)
              _computedStyle.splice(i, 1)
            }
          }
          if (_computedStyle.length) {
            computedStyle.push(..._computedStyle)
          }
        }
      } else if (isBoolean(value) && value) {
        switch (key) {
          case 'rect':
            measureProps.push(...RECT)
            break
          case 'size':
            measureProps.push(...SIZE)
            break
          case 'scrollOffset':
            fns.push(getScrollOffset())
            break
          case 'dataset':
            fns.push(getDataset())
            break
          case 'node':
          case 'context':
          case 'ref':
            fns.push(getInstanceConfig(key))
            break
          default:
            plainProps.push(key)
            break
        }
      }
    }

    if (plainProps.length) {
      fns.push(getPlainProps(plainProps))
    }
    if (measureProps.length) {
      const nodeInstance = nodeRefs[0] && nodeRefs[0].getNodeInstance()
      const hasMeasureFn = nodeInstance && nodeInstance.nodeRef.current && nodeInstance.nodeRef.current.measure
      if (hasMeasureFn) {
        fns.push(getMeasureProps(measureProps))
      } else {
        computedStyle.push(...measureProps)
      }
    }
    if (computedStyle.length) {
      fns.push(getComputedStyle(computedStyle))
    }

    const runCb = () => {
      return flushRefFns(nodeRefs, fns).then((result) => {
        // wx的数据格式：对于具体方法接受到的回调传参，如果获取的 nodeRef 只有一个，那么只需要返回一条数据而不是数组，但是 exec 里面统一都是数组
        cb(result && result.length === 1 ? result[0] : result)
        return result
      })
    }

    return _createSelectorQuery(runCb)
  }

  const boundingClientRect = (cb = noop) => {
    const config = {
      id: true,
      dataset: true,
      rect: true,
      size: true
    }
    return fields(config, cb)
  }

  const context = (cb = noop) => {
    const config = {
      context: true
    }
    return fields(config, cb)
  }

  const node = (cb = noop) => {
    const config = {
      node: true
    }
    return fields(config, cb)
  }

  const ref = (cb = noop) => {
    const config = {
      ref: true
    }
    return fields(config, cb)
  }

  const scrollOffset = (cb = noop) => {
    const config = {
      id: true,
      dataset: true,
      scrollOffset: true
    }
    return fields(config, cb)
  }

  return {
    fields,
    boundingClientRect,
    context,
    node,
    ref,
    scrollOffset
  }
}

export default function getRefsMixin () {
  return {
    [BEFORECREATE] () {
      this._$refs = {}
      this.$refs = {}
      this.__getRefs()
    },
    methods: {
      __getRefs () {
        const refs = this.__getRefsData() || []
        const target = this
        refs.forEach(({ key, type, all }) => {
          Object.defineProperty(this.$refs, key, {
            enumerable: true,
            configurable: true,
            get () {
              const refs = target._$refs[key] || []
              if (type === 'component') {
                return all ? refs : refs[0]
              } else {
                return _createNodesRef(refs)
              }
            }
          })
        })
      },
      __getRefVal (key) {
        if (!this._$refs[key]) {
          this._$refs[key] = []
        }
        return (instance) => instance && this._$refs[key].push(instance)
      },
      __resetRefs () {
        this._$refs = {}
      }
    }
  }
}
