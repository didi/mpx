import { BEFORECREATE } from '../../core/innerLifecycle'
import { noop, getEnvObj } from '@mpxjs/utils'

const envObj = getEnvObj()

const setRef = function (target, ref, isAsync) {
  const targetRefs = isAsync ? target.$asyncRefs : target.$refs
  Object.defineProperty(targetRefs, ref.key, {
    enumerable: true,
    configurable: true,
    get () {
      // 对于组件，由于分包异步化的存在，每次都需要重新执行selectComponent，避免一直获取到placeholder
      // 对于节点，每次都需要获取全新的selectorQuery
      return target.__getRefNode(ref, isAsync)
    }
  })
}

export default function getRefsMixin () {
  const refsMixin = {
    [BEFORECREATE] () {
      this.$refs = {}
      this.$asyncRefs = {}
      this.__getRefs()

      if (__mpx_mode__ === 'ali') {
        this._originCreateSelectorQuery = this.createSelectorQuery
        this.createSelectorQuery = this._createSelectorQuery
      }
    },
    methods: {
      __getRefs () {
        if (this.__getRefsData) {
          const refs = this.__getRefsData()
          refs.forEach(ref => {
            setRef(this, ref)
            if (__mpx_mode__ === 'tt' && ref.type === 'component') {
              setRef(this, ref, true)
            }
          })
        }
      },
      __getRefNode (ref, isAsync) {
        if (!ref) return
        const selector = ref.selector.replace(/{{mpxCid}}/g, this.__mpxProxy.uid)
        if (ref.type === 'node') {
          const query = this.createSelectorQuery ? this.createSelectorQuery() : envObj.createSelectorQuery()
          return query && (ref.all ? query.selectAll(selector) : query.select(selector))
        } else if (ref.type === 'component') {
          if (isAsync) {
            return new Promise((resolve) => {
              ref.all ? this.selectAllComponents(selector, resolve) : this.selectComponent(selector, resolve)
            })
          } else {
            return ref.all ? this.selectAllComponents(selector) : this.selectComponent(selector)
          }
        }
      }
    }
  }

  if (__mpx_mode__ === 'ali') {
    Object.assign(refsMixin, {
      data () {
        return {
          mpxCid: this.__mpxProxy.uid
        }
      }
    })

    const proxyMethods = ['boundingClientRect', 'scrollOffset']

    Object.assign(refsMixin.methods, {
      _createSelectorQuery (...args) {
        let selectorQuery = this._originCreateSelectorQuery(...args)
        const cbs = []

        if (typeof selectorQuery === 'undefined') {
          // 兜底 selectorQuery 在ali为 undefined 情况
          // 调用 createSelectorQuery时，组件实例已经被销毁，ali this._originCreateSelectorQuery 返回 undefined。导致后续 selectorQuery[name] 报错
          // 方案：对齐微信，微信实例销毁时，其他调用正常，仅 createSelectorQuery.exec 不执行回调
          // 复现：setTimeout 中调用，倒计时未回调时切换页面
          selectorQuery = {}
          // ['boundingClientRect', 'context', 'exec', 'fields', 'in', 'node', 'scrollOffset', 'select', 'selectAll', 'selectViewport', 'toImage']
          const backupMethodKeys = Object.keys(envObj.createSelectorQuery())
          const backupFn = function () {
            return selectorQuery
          }
          backupMethodKeys.forEach(key => {
            selectorQuery[key] = backupFn
          })
          return selectorQuery
        }

        proxyMethods.forEach((name) => {
          const originalMethod = selectorQuery[name]
          selectorQuery[name] = function (cb = noop) {
            cbs.push(cb)
            return originalMethod.call(this)
          }
        })

        const originalExec = selectorQuery.exec
        selectorQuery.exec = function (originalCb = noop) {
          const cb = function (results) {
            results.forEach((item, index) => {
              cbs[index] && cbs[index](item)
            })
            originalCb(results)
          }
          return originalExec.call(this, cb)
        }

        return selectorQuery
      },
      selectComponent (selector) {
        return this.$selectComponent(selector)
      },
      selectAllComponents (selector) {
        return this.$selectAllComponents(selector)
      }
    })
  }

  return refsMixin
}
