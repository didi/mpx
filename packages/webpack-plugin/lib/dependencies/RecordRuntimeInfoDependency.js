const NullDependency = require('webpack/lib/dependencies/NullDependency')
const makeSerializable = require('webpack/lib/util/makeSerializable')

class RecordRuntimeInfoDependency extends NullDependency {
  constructor (packageName, resourcePath, { templateInfo, jsonInfo, styleInfo } = {}) {
    super()
    this.packageName = packageName
    this.resourcePath = resourcePath
    this.templateInfo = templateInfo
    this.jsonInfo = jsonInfo
    this.styleInfo = styleInfo
  }

  get type () {
    return 'mpx record runtime component info'
  }

  mpxAction (module, compilation, callback) {
    const mpx = compilation.__mpx__

    mpx.runtimeInfo[this.packageName] = mpx.runtimeInfo[this.packageName] || {}
    mpx.runtimeInfo[this.packageName][this.resourcePath] = mpx.runtimeInfo[this.packageName][this.resourcePath] || {
      template: {},
      json: {},
      style: [],
      moduleId: '_' + mpx.pathHash(this.resourcePath)
    }

    if (this.templateInfo) {
      this.collectTemplateInfo(mpx)
    } else if (this.jsonInfo) {
      this.collectJsonInfo(mpx)
    } else if (this.styleInfo) {
      this.collectStyleInfo(mpx)
    }

    return callback()
  }

  collectTemplateInfo (mpx) {
    const templateInfo = this.getInfoConfig(mpx, 'template')

    Object.assign(templateInfo, {
      baseComponents: {},
      customComponents: {},
      dynamicSlotDependencies: this.templateInfo.dynamicSlotDependencies,
      templateAst: this.templateInfo.templateAst
    })

    const componentTypes = ['baseComponents', 'customComponents']
    componentTypes.forEach(type => {
      const attrsMap = templateInfo[type]
      for (const tag in this.templateInfo[type]) {
        if (!attrsMap[tag]) {
          attrsMap[tag] = {}
        }
        Object.assign(attrsMap[tag], this.templateInfo[type][tag])
      }
    })
  }

  collectJsonInfo (mpx) {
    const jsonInfo = this.getInfoConfig(mpx, 'json')
    for (const resourcePath in this.jsonInfo) {
      const info = this.jsonInfo[resourcePath]
      const componentName = info.name
      const hashName = 'm' + mpx.pathHash(resourcePath)
      jsonInfo[componentName] = {
        hashName,
        resourcePath,
        isDynamic: info.query.isDynamic
      }
    }
  }

  collectStyleInfo (mpx) {
    const styleInfo = this.getInfoConfig(mpx, 'style')
    if (this.styleInfo.cssList && this.styleInfo.cssList.length > 0) {
      styleInfo.push(...this.styleInfo.cssList)
    }
  }

  getInfoConfig (mpx, type) {
    return mpx.runtimeInfo[this.packageName][this.resourcePath][type]
  }

  serialize (context) {
    const { write } = context
    write(this.packageName)
    write(this.resourcePath)
    write(this.templateInfo)
    write(this.jsonInfo)
    write(this.styleInfo)
    super.serialize(context)
  }

  deserialize (context) {
    const { read } = context
    this.packageName = read()
    this.resourcePath = read()
    this.templateInfo = read()
    this.jsonInfo = read()
    this.styleInfo = read()
    super.deserialize(context)
  }
}

RecordRuntimeInfoDependency.Template = class RecordModuleTemplateDependencyTemplate {
  apply () {}
}

makeSerializable(RecordRuntimeInfoDependency, '@mpxjs/webpack-plugin/lib/dependencies/RecordRuntimeInfoDependency')

module.exports = RecordRuntimeInfoDependency
