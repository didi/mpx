import { noop, isBoolean, isString, hasOwn, makeMap, dash2hump, warn } from '@mpxjs/utils'

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
    selectViewport: () => { // scrollOffset -> 有点难实现，dimension 目前没有暴露相关 api
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

const createMeasureObj = (nodeRef) => {
  const allProps = new Set()
  return {
    addProps (prop) {
      if (isString(prop)) {
        prop = [prop]
      }
      prop.forEach(item => allProps.add(item))
    },
    measure () {
      return new Promise((resolve) => {
        nodeRef.measure(function (x, y, width, height, pageX, pageY) {
          const rectAndSize = {
            width,
            height,
            left: pageX,
            top: pageY,
            right: pageX + width,
            bottom: pageY + height
          }
          const result = [...allProps].reduce((preVal, key) => {
            return Object.assign(preVal, { [key]: rectAndSize[key] || 0 })
          }, {})
          resolve(result)
        })
      })
    }
  }
}

const datasetReg = /^data-(.+)$/

const getDataset = (props) => {
  return wrapFn((resolve) => {
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
    for (const key in config) {
      // todo: 确认目前的字段编译规则，是连字符还是转成驼峰了
      res[dash2hump(key)] = props[key] || props[dash2hump(key)]
    }
    resolve(res)
  })
}

const getComputedStyle = (config, props) => {
  // 从 props.style 上获取
  return wrapFn((resolve) => {
    const styles = props.style
    const res = {}
    config.forEach((key) => {
      // 后序遍历，取到就直接返回
      let length = styles.length - 1
      while (length >= 0) {
        const styleObj = styles[length--]
        if (styleObj[key]) {
          res[key] = styleObj[key]
          break
        }
      }
    })
    resolve(res)
  })
}

const getInstanceConfig = (config, instance) => {
  return wrapFn((resolve) => {
    resolve({ [config]: instance[config] || {} })
  })
}

const getScrollOffsetFallback = (cb) => {
  const res = {
    scrollLeft: 0,
    scrollTop: 0,
    scrollHeight: 0,
    scrollWidth: 0
  }
  cb(res)
}

const RECT = ['left', 'top', 'right', 'bottom']
const SIZE = ['width', 'height']

export default function createNodesRef (props, instance) {
  const nodeRef = instance.nodeRef

  const fields = (config, cb = noop) => {
    const plainProps = {}
    const fns = []
    let measureObj = null

    const addMeasureProps = (prop) => {
      if (!measureObj) {
        measureObj = createMeasureObj(nodeRef)
        fns.push(measureObj.measure)
      }
      measureObj.addProps(prop)
    }

    for (const key in config) {
      const value = config[key]
      if (Array.isArray(value) && value.length) {
        if (key === 'properties') {
          Object.assign(plainProps, makeMap(value))
        } else if (key === 'computedStyle') {
          const computedStyle = config.computedStyle
          computedStyle.forEach((style) => {
            if (RECT.includes(style) || SIZE.includes(style)) {
              addMeasureProps(style)
            }
          })
          fns.push(getComputedStyle(computedStyle, props))
        }
      } else if (isBoolean(value) && value) {
        switch (key) {
          case 'rect':
            addMeasureProps(RECT)
            break
          case 'size':
            addMeasureProps(SIZE)
            break
          case 'scrollOffset':
            fns.push(wrapFn(instance.scrollOffset || getScrollOffsetFallback))
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
            plainProps[key] = value
            fns.push(getPlainProps(plainProps, props))
            break
        }
      }
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
