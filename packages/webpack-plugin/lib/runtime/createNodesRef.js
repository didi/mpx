import { noop, isBoolean, hasOwn, dash2hump, warn } from '@mpxjs/utils'
import { StyleSheet } from 'react-native'

const _createSelectorQuery = (runCb) => {
  return {
    exec: (cb = noop) => {
      runCb().then(res => {
        res = [res]
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

const flushRefFns = (fns) => {
  return Promise.all(fns.map(fn => fn())).then((res) => {
    return res.reduce((preVal, curVal) => {
      return Object.assign(preVal, curVal)
    }, {})
  })
}

const wrapFn = (fn) => {
  return () => {
    return new Promise((resolve) => {
      fn(resolve)
    })
  }
}

const getMeasureProps = (measureProps = [], nodeRef) => {
  return wrapFn((resolve) => {
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
    }, 10)
  })
}

// todo: 方便调试，后续改为连字符
const datasetReg = /^data(.+)$/

const getDataset = (props) => {
  return wrapFn((resolve) => {
    props = props.current
    const dataset = {}
    for (const key in props) {
      if (hasOwn(props, key)) {
        const matched = datasetReg.exec(key)
        if (matched) {
          dataset[matched[1]] = props[key]
        }
      }
    }
    resolve({ dataset })
  })
}

const getPlainProps = (config, props) => {
  return wrapFn((resolve) => {
    const res = {}
    config.forEach((key) => {
      // todo 这个代码后续需要改动，现在属性默认不转驼峰
      res[dash2hump(key)] = props.current[key] || props.current[dash2hump(key)]
    })
    resolve(res)
  })
}

const getComputedStyle = (config = [], props, defaultStyle = {}) => {
  return wrapFn((resolve) => {
    config = new Set(config)
    const res = {}
    const styles = props.current.style || []
    const computedStyle = StyleSheet.flatten([defaultStyle, ...styles])
    config.forEach((key) => {
      const humpKey = dash2hump(key)
      // 取 style 的 key 是根据传入的 key 来设置，传什么设置什么 key，只不过取值需要做兼容
      res[key] = computedStyle[key] || computedStyle[humpKey] || ''
    })

    resolve(res)
  })
}

const getInstanceConfig = (config, instance) => {
  return wrapFn((resolve) => {
    resolve({ [config]: instance[config] || {} })
  })
}

const defaultScrollOffset = {
  scrollLeft: 0,
  scrollTop: 0,
  scrollHeight: 0,
  scrollWidth: 0
}

const getScrollOffset = (instance) => {
  return wrapFn((resolve) => {
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

export default function createNodesRef (props, instance) {
  const nodeRef = instance.nodeRef.current

  const fields = (config, cb = noop) => {
    const plainProps = []
    const measureProps = []
    const computedStyle = []
    const fns = []

    for (const key in config) {
      const value = config[key]
      if (Array.isArray(value) && value.length) {
        if (key === 'properties') {
          plainProps.push(...value)
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
            fns.push(getScrollOffset(instance))
            break
          case 'dataset':
            fns.push(getDataset(props))
            break
          case 'node':
          case 'context':
          case 'ref':
            fns.push(getInstanceConfig(key, instance))
            break
          default:
            plainProps.push(key)
            break
        }
      }
    }

    if (plainProps.length) {
      fns.push(getPlainProps(plainProps, props))
    }
    if (measureProps.length) {
      if (nodeRef.measure) {
        fns.push(getMeasureProps(measureProps, nodeRef))
      } else {
        computedStyle.push(...measureProps)
      }
    }
    if (computedStyle.length) {
      fns.push(getComputedStyle(computedStyle, props, instance.defaultStyle))
    }

    const runCb = () => {
      return flushRefFns(fns).then((result) => {
        cb(result)
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
