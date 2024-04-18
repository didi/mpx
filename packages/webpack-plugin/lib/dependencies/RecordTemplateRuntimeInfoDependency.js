const NullDependency = require('webpack/lib/dependencies/NullDependency')
const makeSerializable = require('webpack/lib/util/makeSerializable')

class RecordTemplateRuntimeInfoDependency extends NullDependency {
  constructor (packageName, resourcePath, { resourceHashNameMap, runtimeComponents, normalComponents, baseComponents, wxs } = {}) {
    super()
    this.packageName = packageName
    this.resourcePath = resourcePath
    this.resourceHashNameMap = resourceHashNameMap
    this.runtimeComponents = runtimeComponents
    this.normalComponents = normalComponents
    this.baseComponents = baseComponents
    this.wxs = wxs
  }

  get type () {
    return 'mpx record template runtime info'
  }

  mpxAction (module, compilation, callback) {
    const mpx = compilation.__mpx__
    if (!mpx.runtimeInfo[this.packageName]) {
      mpx.runtimeInfo[this.packageName] = {
        resourceHashNameMap: {},
        baseComponents: {},
        normalComponents: {
          'block': {} // 默认增加block节点，防止根节点渲染失败
        },
        runtimeComponents: {},
        wxs: new Set()
      }
    }

    this.mergeResourceHashNameMap(mpx)
    this.mergeComponentAttrs(mpx)
    // this.mergeWxs(mpx)

    return callback()
  }

  // mergeWxs (mpx) {
  //   if (this.wxs.length) {
  //     this.wxs.forEach(item => mpx.runtimeInfo[this.packageName].wxs.add(item))
  //   }
  // }

  mergeComponentAttrs (mpx) {
    const componentTypes = ['baseComponents', 'normalComponents', 'runtimeComponents']
    componentTypes.forEach(type => {
      const attrsMap = mpx.runtimeInfo[this.packageName][type]
      for (const tag in this[type]) {
        if (!attrsMap[tag]) {
          attrsMap[tag] = {}
        }
        Object.assign(attrsMap[tag], this[type][tag])
      }
    })
  }

  mergeResourceHashNameMap (mpx) {
    Object.assign(mpx.runtimeInfo[this.packageName].resourceHashNameMap, this.resourceHashNameMap)
  }

  serialize (context) {
    const { write } = context
    write(this.packageName)
    write(this.resourcePath)
    write(this.resourceHashNameMap)
    write(this.runtimeComponents)
    write(this.normalComponents)
    write(this.baseComponents)
    super.serialize(context)
  }

  deserialize (context) {
    const { read } = context
    this.packageName = read()
    this.resourcePath = read()
    this.resourceHashNameMap = read()
    this.runtimeComponents = read()
    this.normalComponents = read()
    this.baseComponents = read()
    super.deserialize(context)
  }
}

RecordTemplateRuntimeInfoDependency.Template = class RecordModuleTemplateDependencyTemplate {
  apply () {}
}

makeSerializable(RecordTemplateRuntimeInfoDependency, '@mpxjs/webpack-plugin/lib/dependencies/RecordTemplateRuntimeInfoDependency')

module.exports = RecordTemplateRuntimeInfoDependency
