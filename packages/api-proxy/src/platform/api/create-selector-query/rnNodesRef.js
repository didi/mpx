import {
  noop,
  isBoolean,
  dash2hump,
  collectDataset,
  hump2dash,
  isArray,
  getFocusedNavigation
} from '@mpxjs/utils'

const flushRefFns = (nodeInstances, fns, single) => {
  // wx的数据格式：对于具体方法接受到的回调传参，如果获取的 nodeRef 只有一个，那么只需要返回一条数据而不是数组，但是 exec 里面统一都是数组
  const mountedNodeInstance = nodeInstances
    .map((instance) => instance.getNodeInstance())
    .filter(({ nodeRef }) => nodeRef.current) // 如果有 nodeRef，表明目前组件处于挂载中
  if (mountedNodeInstance.length) {
    return Promise.all(
      mountedNodeInstance.map((instance) => flushFns(instance, fns))
    ).then((result = []) => (single ? result[0] : result))
  } else {
    return Promise.resolve(single ? null : [])
  }
}

const flushFns = (nodeInstance, fns) => {
  return Promise.all(fns.map((fn) => fn(nodeInstance))).then((res) => {
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
    const navigation = getFocusedNavigation() || {}
    setTimeout(() => {
      nodeRef.measure(function (x, y, width, height, pageX, pageY) {
        const layout = navigation.layout || {}
        pageY = pageY - (layout.top || 0)
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
    }, 30) // 延迟，等待组件在rn视图上真正渲染出来
  })
}

const getDataset = (props) => {
  return wrapFn((nodeInstance, resolve) => {
    props = nodeInstance.props.current
    resolve({
      dataset: collectDataset(props)
    })
  })
}

const getPlainProps = (config) => {
  return wrapFn((nodeInstance, resolve) => {
    const res = {}
    const props = nodeInstance.props.current
    config.forEach((key) => {
      // props 属性默认不转驼峰，用户写什么格式不会变化，取值做兼容
      res[key] = props[key] || props[hump2dash(key)] || ''
    })
    resolve(res)
  })
}

const getComputedStyle = (config = []) => {
  return wrapFn((nodeInstance, resolve) => {
    config = new Set(config)
    const res = {}
    const computedStyle = nodeInstance.instance.style || {}
    config.forEach((key) => {
      const humpKey = dash2hump(key)
      // 取 style 的 key 是根据传入的 key 来设置，传什么设置什么 key，只不过取值需要做兼容
      res[key] = computedStyle[key] || computedStyle[humpKey] || ''
    })

    resolve(res)
  })
}

const getInstanceConfig = (config) => {
  return wrapFn((nodeInstance, resolve) => {
    const instance = nodeInstance.instance
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
  return wrapFn((nodeInstance, resolve) => {
    const instance = nodeInstance.instance
    resolve(
      (instance.scrollOffset && instance.scrollOffset.current) ||
        defaultScrollOffset
    )
  })
}

const RECT = ['left', 'top', 'right', 'bottom']
const SIZE = ['width', 'height']

class NodeRef {
  constructor (nodeRefs = [], selectorQuery, single) {
    if (!isArray(nodeRefs)) {
      nodeRefs = [nodeRefs]
    }
    this.nodeRefs = nodeRefs
    this.selectorQuery = selectorQuery
    this.single = single
  }

  fields (config, cb = noop) {
    const plainProps = []
    const measureProps = []
    const computedStyle = []
    const fns = []

    for (const key in config) {
      const value = config[key]
      if (Array.isArray(value) && value.length) {
        if (key === 'properties') {
          // wx 最终输出的 properties 字段都会转化为驼峰，所以在这里提前处理为最终的字段格式
          plainProps.push(...value.map((v) => dash2hump(v)))
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
      const nodeInstance =
        this.nodeRefs[0] && this.nodeRefs[0].getNodeInstance()
      const hasMeasureFn =
        nodeInstance &&
        nodeInstance.nodeRef.current &&
        nodeInstance.nodeRef.current.measure
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
      return flushRefFns(this.nodeRefs, fns, this.single).then((result) => {
        cb(result)
        return result
      })
    }

    this.selectorQuery._queueCb.push(runCb)

    return this.selectorQuery
  }

  boundingClientRect (cb = noop) {
    const config = {
      id: true,
      dataset: true,
      rect: true,
      size: true
    }
    return this.fields(config, cb)
  }

  context (cb = noop) {
    const config = {
      context: true
    }
    return this.fields(config, cb)
  }

  node (cb = noop) {
    const config = {
      node: true
    }
    return this.fields(config, cb)
  }

  ref (cb = noop) {
    const config = {
      ref: true
    }
    return this.fields(config, cb)
  }

  scrollOffset (cb = noop) {
    const config = {
      id: true,
      dataset: true,
      scrollOffset: true
    }
    return this.fields(config, cb)
  }
}

export default NodeRef
