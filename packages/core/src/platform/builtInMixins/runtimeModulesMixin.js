import { CREATED } from '../../core/innerLifecycle'
import staticMap from '../../vnode/staticMap'

export default function getRuntimeModulesMixin () {
  return {
    data: {
      __mpxDynamicLoaded: false
    },
    [CREATED] () {
      const runtimeModules = this.__getRuntimeModules && this.__getRuntimeModules()
      if (runtimeModules) {
        // 判断是否有还未获取的组件内容
        const moduleIds = []
        for (const component in runtimeModules) {
          const moduleId = runtimeModules[component]
          if (!staticMap[moduleId]) {
            moduleIds.push(moduleId)
          }
        }
        if (typeof this.mpxLoadDynamic === 'function' && moduleIds.length) {
          // todo: 依赖业务侧的约定，在业务侧的具体实现一个资源位对应一个 id，请求数据后在内存当中挂载
          this.mpxLoadDynamic().then(data => {
            this.__mpxDynamicLoaded = true
            Object.assign(staticMap, data)
          }).catch(e => {
            // do something
          })
        }
      }
    }
  }
}
