module.exports = {
  wx: {
    typeExtMap: {
      json: '.json',
      script: '.js',
      template: '.wxml',
      styles: '.wxss'
    },
    tabBar: {
      itemKey: 'list',
      iconKey: 'iconPath',
      activeIconKey: 'selectedIconPath'
    },
    event: {
      parseEvent (attr) {
        let match = /^(bind|catch|capture-bind|capture-catch):?(.*?)(?:\.(.*))?$/.exec(attr)
        if (match) {
          return {
            prefix: match[1],
            eventName: match[2],
            modifier: match[3]
          }
        }
      },
      getEvent (eventName, prefix = 'bind') {
        return prefix + eventName
      },
      defaultModelProp: 'value',
      defaultModelEvent: 'input',
      defaultModelValuePath: 'value',
      shallowStringify (obj) {
        let arr = []
        for (let key in obj) {
          let value = obj[key]
          if (Array.isArray(value)) {
            value = `[${value.join(',')}]`
          }
          arr.push(`${key}:${value}`)
        }
        return ` {${arr.join(',')}} `
      }
    },
    wxs: {
      tag: 'wxs',
      module: 'module',
      src: 'src',
      ext: '.wxs',
      templatePrefix: 'module.exports = \n'
    },
    directive: {
      if: 'wx:if',
      elseif: 'wx:elif',
      else: 'wx:else',
      model: 'wx:model',
      modelProp: 'wx:model-prop',
      modelEvent: 'wx:model-event',
      modelValuePath: 'wx:model-value-path',
      modelFilter: 'wx:model-filter',
      for: 'wx:for',
      forIndex: 'wx:for-index',
      forItem: 'wx:for-item',
      key: 'wx:key',
      dynamicClass: 'wx:class',
      dynamicStyle: 'wx:style',
      ref: 'wx:ref',
      show: 'wx:show'
    }
  },
  ali: {
    typeExtMap: {
      json: '.json',
      script: '.js',
      template: '.axml',
      styles: '.acss'
    },
    tabBar: {
      itemKey: 'items',
      iconKey: 'icon',
      activeIconKey: 'activeIcon'
    },
    optionMenu: {
      iconKey: 'icon'
    },
    event: {
      parseEvent (attr) {
        let match = /^(on|catch)([A-Z].*?)(?:\.(.*))?$/.exec(attr)
        if (match) {
          return {
            prefix: match[1],
            eventName: match[2].replace(/^./, function (match) {
              return match.toLowerCase()
            }),
            modifier: match[3]
          }
        }
      },
      getEvent (eventName, prefix = 'on') {
        return prefix + eventName.replace(/^./, (matched) => {
          return matched.toUpperCase()
        })
      },
      defaultModelProp: 'value',
      defaultModelEvent: 'input',
      defaultModelValuePath: 'value',
      shallowStringify (obj) {
        let arr = []
        for (let key in obj) {
          let value = obj[key]
          if (Array.isArray(value)) {
            value = `[${value.join(',')}]`
          }
          arr.push(`${key}:${value}`)
        }
        return ` {${arr.join(',')}} `
      }
    },
    wxs: {
      tag: 'import-sjs',
      module: 'name',
      src: 'from',
      ext: '.sjs',
      templatePrefix: 'export default \n'
    },
    directive: {
      if: 'a:if',
      elseif: 'a:elif',
      else: 'a:else',
      model: 'a:model',
      modelProp: 'a:model-prop',
      modelEvent: 'a:model-event',
      modelValuePath: 'a:model-value-path',
      modelFilter: 'a:model-filter',
      for: 'a:for',
      forIndex: 'a:for-index',
      forItem: 'a:for-item',
      key: 'a:key',
      dynamicClass: 'a:class',
      dynamicStyle: 'a:style',
      ref: 'a:ref',
      show: 'a:show'
    },
    eventProxyIgnoreTagArr: ['map']
  },
  swan: {
    typeExtMap: {
      json: '.json',
      script: '.js',
      template: '.swan',
      styles: '.css'
    },
    tabBar: {
      itemKey: 'list',
      iconKey: 'iconPath',
      activeIconKey: 'selectedIconPath'
    },
    event: {
      parseEvent (attr) {
        let match = /^(bind|catch|capture-bind|capture-catch):?(.*?)(?:\.(.*))?$/.exec(attr)
        if (match) {
          return {
            prefix: match[1],
            eventName: match[2],
            modifier: match[3]
          }
        }
      },
      getEvent (eventName, prefix = 'bind') {
        return prefix + eventName
      },
      defaultModelProp: 'value',
      defaultModelEvent: 'input',
      defaultModelValuePath: 'value',
      shallowStringify (obj) {
        let arr = []
        for (let key in obj) {
          let value = obj[key]
          if (Array.isArray(value)) {
            value = `[${value.join(',')}]`
          }
          arr.push(`${key}:${value}`)
        }
        return ` {${arr.join(',')}} `
      }
    },
    wxs: {
      tag: 'import-sjs',
      module: 'module',
      src: 'src',
      ext: '.sjs',
      templatePrefix: 'export default \n'
    },
    directive: {
      if: 's-if',
      elseif: 's-elif',
      else: 's-else',
      model: 's-model',
      modelProp: 's-model-prop',
      modelEvent: 's-model-event',
      modelValuePath: 's-model-value-path',
      modelFilter: 's-model-filter',
      for: 's-for',
      forIndex: 's-for-index',
      forItem: 's-for-item',
      key: 's-key',
      dynamicClass: 's-class',
      dynamicStyle: 's-style',
      ref: 's-ref',
      show: 's-show'
    }
  },
  qq: {
    typeExtMap: {
      json: '.json',
      script: '.js',
      template: '.qml',
      styles: '.qss'
    },
    tabBar: {
      itemKey: 'list',
      iconKey: 'iconPath',
      activeIconKey: 'selectedIconPath'
    },
    event: {
      parseEvent (attr) {
        let match = /^(bind|catch|capture-bind|capture-catch):?(.*?)(?:\.(.*))?$/.exec(attr)
        if (match) {
          return {
            prefix: match[1],
            eventName: match[2],
            modifier: match[3]
          }
        }
      },
      getEvent (eventName, prefix = 'bind') {
        return prefix + eventName
      },
      defaultModelProp: 'value',
      defaultModelEvent: 'input',
      defaultModelValuePath: 'value',
      shallowStringify (obj) {
        let arr = []
        for (let key in obj) {
          let value = obj[key]
          if (Array.isArray(value)) {
            value = `[${value.join(',')}]`
          }
          arr.push(`${key}:${value}`)
        }
        return `({${arr.join(',')}})`
      }
    },
    wxs: {
      tag: 'qs',
      module: 'module',
      src: 'src',
      ext: '.qs',
      templatePrefix: 'module.exports = \n'
    },
    directive: {
      if: 'qq:if',
      elseif: 'qq:elif',
      else: 'qq:else',
      model: 'qq:model',
      modelProp: 'qq:model-prop',
      modelEvent: 'qq:model-event',
      modelValuePath: 'qq:model-value-path',
      modelFilter: 'qq:model-filter',
      for: 'qq:for',
      forIndex: 'qq:for-index',
      forItem: 'qq:for-item',
      key: 'qq:key',
      dynamicClass: 'qq:class',
      dynamicStyle: 'qq:style',
      ref: 'qq:ref',
      show: 'qq:show'
    }
  },
  tt: {
    typeExtMap: {
      json: '.json',
      script: '.js',
      template: '.ttml',
      styles: '.ttss'
    },
    tabBar: {
      itemKey: 'list',
      iconKey: 'iconPath',
      activeIconKey: 'selectedIconPath'
    },
    event: {
      parseEvent (attr) {
        let match = /^(bind|catch|capture-bind|capture-catch):?(.*?)(?:\.(.*))?$/.exec(attr)
        if (match) {
          return {
            prefix: match[1],
            eventName: match[2],
            modifier: match[3]
          }
        }
      },
      getEvent (eventName, prefix = 'bind') {
        return prefix + eventName
      },
      defaultModelProp: 'value',
      defaultModelEvent: 'input',
      defaultModelValuePath: 'value',
      shallowStringify (obj) {
        let arr = []
        for (let key in obj) {
          let value = obj[key]
          if (Array.isArray(value)) {
            value = `[${value.join(',')}]`
          }
          arr.push(`${key}:${value}`)
        }
        return ` {${arr.join(',')}} `
      }
    },
    wxs: {
      tag: 'sjs',
      module: 'module',
      src: 'src',
      ext: '.sjs',
      templatePrefix: 'module.exports = \n'
    },
    directive: {
      if: 'tt:if',
      elseif: 'tt:elif',
      else: 'tt:else',
      model: 'tt:model',
      modelProp: 'tt:model-prop',
      modelEvent: 'tt:model-event',
      modelValuePath: 'tt:model-value-path',
      modelFilter: 'tt:model-filter',
      for: 'tt:for',
      forIndex: 'tt:for-index',
      forItem: 'tt:for-item',
      key: 'tt:key',
      dynamicClass: 'tt:class',
      dynamicStyle: 'tt:style',
      ref: 'tt:ref',
      show: 'tt:show'
    }
  },
  web: {
    directive: {
      if: 'v-if',
      elseif: 'v-else-if',
      else: 'v-else'
    },
    wxs: {
      tag: 'wxs',
      module: 'module',
      src: 'src',
      ext: '.wxs',
      templatePrefix: 'module.exports = \n'
    }
  },
  qa: {
    typeExtMap: {
      json: '.json',
      script: '.js',
      template: '.qxml',
      styles: '.css'
    },
    tabBar: {
      itemKey: 'list',
      iconKey: 'iconPath',
      activeIconKey: 'selectedIconPath'
    },
    event: {
      parseEvent (attr) {
        let match = /^(bind|catch|capture-bind|capture-catch):?(.*?)(?:\.(.*))?$/.exec(attr)
        if (match) {
          return {
            prefix: match[1],
            eventName: match[2],
            modifier: match[3]
          }
        }
      },
      getEvent (eventName, prefix = 'bind') {
        return prefix + eventName
      },
      defaultModelProp: 'value',
      defaultModelEvent: 'input',
      defaultModelValuePath: 'value',
      shallowStringify (obj) {
        let arr = []
        for (let key in obj) {
          let value = obj[key]
          if (Array.isArray(value)) {
            value = `[${value.join(',')}]`
          }
          arr.push(`${key}:${value}`)
        }
        return ` {${arr.join(',')}} `
      }
    },
    wxs: {
      tag: 'qjs',
      module: 'name',
      src: 'from',
      ext: '.qjs',
      templatePrefix: 'export default \n'
    },
    directive: {
      if: 'qa:if',
      elseif: 'qa:elif',
      else: 'qa:else',
      model: 'qa:model',
      modelProp: 'qa:model-prop',
      modelEvent: 'qa:model-event',
      modelValuePath: 'qa:model-value-path',
      modelFilter: 'qa:model-filter',
      for: 'qa:for',
      forIndex: 'qa:for-index',
      forItem: 'qa:for-item',
      key: 'qa:key',
      dynamicClass: 'qa:class',
      dynamicStyle: 'qa:style',
      ref: 'qa:ref',
      show: 'qa:show'
    }
  },
  jd: {
    typeExtMap: {
      json: '.json',
      script: '.js',
      template: '.jxml',
      styles: '.jxss'
    },
    tabBar: {
      itemKey: 'list',
      iconKey: 'iconPath',
      activeIconKey: 'selectedIconPath'
    },
    event: {
      parseEvent (attr) {
        let match = /^(bind|catch|capture-bind|capture-catch):?(.*?)(?:\.(.*))?$/.exec(attr)
        if (match) {
          return {
            prefix: match[1],
            eventName: match[2],
            modifier: match[3]
          }
        }
      },
      getEvent (eventName, prefix = 'bind') {
        return prefix + eventName
      },
      defaultModelProp: 'value',
      defaultModelEvent: 'input',
      defaultModelValuePath: 'value',
      shallowStringify (obj) {
        let arr = []
        for (let key in obj) {
          let value = obj[key]
          if (Array.isArray(value)) {
            value = `[${value.join(',')}]`
          }
          arr.push(`${key}:${value}`)
        }
        return ` {${arr.join(',')}} `
      }
    },
    wxs: {
      tag: 'jds',
      module: 'module',
      src: 'src',
      ext: '.jds',
      templatePrefix: 'module.exports = \n'
    },
    directive: {
      if: 'jd:if',
      elseif: 'jd:elif',
      else: 'jd:else',
      model: 'jd:model',
      modelProp: 'jd:model-prop',
      modelEvent: 'jd:model-event',
      modelValuePath: 'jd:model-value-path',
      modelFilter: 'jd:model-filter',
      for: 'jd:for',
      forIndex: 'jd:for-index',
      forItem: 'jd:for-item',
      key: 'jd:key',
      dynamicClass: 'jd:class',
      dynamicStyle: 'jd:style',
      ref: 'jd:ref',
      show: 'jd:show'
    }
  },
  dd: {
    typeExtMap: {
      json: '.json',
      script: '.js',
      template: '.ddml',
      styles: '.ddss'
    },
    tabBar: {
      itemKey: 'list',
      iconKey: 'iconPath',
      activeIconKey: 'selectedIconPath'
    },
    event: {
      parseEvent (attr) {
        let match = /^(bind|catch|capture-bind|capture-catch):?(.*?)(?:\.(.*))?$/.exec(attr)
        if (match) {
          return {
            prefix: match[1],
            eventName: match[2],
            modifier: match[3]
          }
        }
      },
      getEvent (eventName, prefix = 'bind') {
        return prefix + eventName
      },
      defaultModelProp: 'value',
      defaultModelEvent: 'input',
      defaultModelValuePath: 'value',
      shallowStringify (obj) {
        let arr = []
        for (let key in obj) {
          let value = obj[key]
          if (Array.isArray(value)) {
            value = `[${value.join(',')}]`
          }
          arr.push(`${key}:${value}`)
        }
        return ` {${arr.join(',')}} `
      }
    },
    wxs: {
      tag: 'dds',
      module: 'module',
      src: 'src',
      ext: '.dds',
      templatePrefix: 'module.exports = \n'
    },
    directive: {
      if: 'dd:if',
      elseif: 'dd:elif',
      else: 'dd:else',
      model: 'dd:model',
      modelProp: 'dd:model-prop',
      modelEvent: 'dd:model-event',
      modelValuePath: 'dd:model-value-path',
      modelFilter: 'dd:model-filter',
      for: 'dd:for',
      forIndex: 'dd:for-index',
      forItem: 'dd:for-item',
      key: 'dd:key',
      dynamicClass: 'dd:class',
      dynamicStyle: 'dd:style',
      ref: 'dd:ref',
      show: 'dd:show'
    }
  },
  ks:{
    typeExtMap: {
      json: '.json',
      script: '.js',
      template: '.ksml',
      styles: '.css'
    },
    tabBar: {
      itemKey: 'list',
      iconKey: 'iconPath',
      activeIconKey: 'selectedIconPath'
    },
    event: {
      parseEvent (attr) {
        let match = /^(bind|catch|capture-bind|capture-catch):?(.*?)(?:\.(.*))?$/.exec(attr)
        if (match) {
          return {
            prefix: match[1],
            eventName: match[2],
            modifier: match[3]
          }
        }
      },
      getEvent (eventName, prefix = 'bind') {
        return prefix + eventName
      },
      defaultModelProp: 'value',
      defaultModelEvent: 'input',
      defaultModelValuePath: 'value',
      shallowStringify (obj) {
        let arr = []
        for (let key in obj) {
          let value = obj[key]
          if (Array.isArray(value)) {
            value = `[${value.join(',')}]`
          }
          arr.push(`${key}:${value}`)
        }
        return ` {${arr.join(',')}} `
      }
    },
    wxs: {},
    directive: {
      if: 'ks:if',
      elseif: 'ks:elif',
      else: 'ks:else',
      for: 'ks:for',
      dynamicClass: 'class',
      dynamicStyle: 'style',
      ref: 'ks:ref',
      show: 'ks:show',
      model: 'ks:model',
      modelProp: 'ks:model-prop',
      modelEvent: 'ks:model-event',
      modelValuePath: 'ks:model-value-path',
      modelFilter: 'ks:model-filter'
    }
  }
}
