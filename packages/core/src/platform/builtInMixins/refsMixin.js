import { BEFORECREATE, CREATED, BEFOREMOUNT, UPDATED, DESTROYED } from '../../core/innerLifecycle'
import { noop } from '../../helper/utils'
import { error } from '../../helper/log'
import { getEnvObj } from '../../helper/env'

const envObj = getEnvObj()

export default function getRefsMixin () {
  let aliMethods
  if (__mpx_mode__ === 'ali') {
    const proxyMethods = ['boundingClientRect', 'scrollOffset']

    aliMethods = {
      createSelectorQuery (...rest) {
        const selectorQuery = my.createSelectorQuery(...rest)
        const cbs = []
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
              cbs[index](item)
            })
            originalCb(results)
          }
          return originalExec.call(this, cb)
        }
        return selectorQuery
      },
      selectComponent (selector, all) {
        const children = this.__children__ || []
        const result = []
        for (const child of children) {
          if (child.identifiers.indexOf(selector) > -1) {
            result.push(child.component)
            if (!all) {
              break
            }
          }
        }
        if (selector.lastIndexOf('.') > 0) {
          const location = this.__mpxProxy && this.__mpxProxy.options.mpxFileResource
          error('The selectComponent or selectAllComponents only supports the single selector, a composed selector is not supported.', location)
        }
        return all ? result : result[0]
      },
      selectAllComponents (selector) {
        return this.selectComponent(selector, true)
      },
      // mode = ali 每个组件都通过 mixin 混入了 __updateRef 方法来通知父组件有个子组件被创建了
      // 父组件在编译 template 的过程当中去查找哪些组件带有 wx:ref 指令
      // 带有 wx:ref 指令的组件会被动态添加 onUpdateRef: __handleUpdateRef key/value 属性，用来响应子组件触发的 updateRef 方法
      // 这样就完成 ref 语法糖的功能
      __updateRef (destroyed) {
        this.triggerEvent && this.triggerEvent('updateRef', {
          component: this,
          destroyed
        })
      },
      __handleUpdateRef (e) {
        if (!this.__children__) {
          this.__children__ = []
        }
        const component = e.detail.component
        const destroyed = e.detail.destroyed
        const className = component.props.mpxClass || component.className
        const identifiers = className ? className.trim().split(/\s+/).map(item => {
          return `.${item}`
        }) : []
        if (component.props.id) {
          identifiers.push(`#${component.props.id}`)
        }
        if (destroyed) {
          this.__children__ = this.__children__.filter(item => item.component !== component)
        } else {
          this.__children__.push({
            component,
            identifiers
          })
        }
      }
    }
  }
  return {
    [BEFORECREATE] () {
      this.$refs = {}
    },
    [CREATED] () {
      this.__updateRef && this.__updateRef()
    },
    [BEFOREMOUNT] () {
      this.__getRefs()
    },
    [UPDATED] () {
      this.__getRefs()
    },
    [DESTROYED] () {
      // 销毁ref
      this.__updateRef && this.__updateRef(true)
    },
    methods: {
      ...aliMethods,
      __getRefs () {
        if (this.__getRefsData) {
          const refs = this.__getRefsData()
          refs.forEach(ref => {
            this.$refs[ref.key] = this.__getRefNode(ref)
          })
        }
      },
      __getRefNode (ref) {
        if (!ref) return
        let selector = ref.selector.replace(/{{mpxCid}}/g, this.__mpxProxy.uid)
        if (ref.type === 'node') {
          const query = this.createSelectorQuery ? this.createSelectorQuery() : envObj.createSelectorQuery()
          return query && (ref.all ? query.selectAll(selector) : query.select(selector))
        } else if (ref.type === 'component') {
          // 头条获取组件ref返回promise
          if (__mpx_mode__ === 'tt') {
            return new Promise((resolve) => {
              ref.all ? this.selectAllComponents(selector, resolve) : this.selectComponent(selector, resolve)
            })
          }
          return ref.all ? this.selectAllComponents(selector) : this.selectComponent(selector)
        }
      }
    }
  }
}
