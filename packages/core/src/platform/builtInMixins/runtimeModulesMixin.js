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
          // 通过 id 获取对应静态内容
          this.mpxLoadDynamic().then(data => {
            this.__mpxDynamicLoaded = true
            for (const componentName in runtimeModules) {
              const moduleId = runtimeModules[componentName]
              staticMap[moduleId] = data[moduleId]
            }
          }).catch(e => {
            // do something
          })
        }
      }
    }
  }
}
