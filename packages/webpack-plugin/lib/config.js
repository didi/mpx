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
    stringify: JSON.stringify,
    event: {
      bindReg: /^(?:bind|catch):?(.*)$/,
      getType (match) {
        return match[1]
      },
      defaultModelProp: 'value',
      defaultModelEvent: 'input',
      getBind (eventName) {
        return 'bind' + eventName
      },
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
    directive: {
      if: 'wx:if',
      elseif: 'wx:elif',
      else: 'wx:else',
      model: 'wx:model',
      modelProp: 'wx:model-prop',
      modelEvent: 'wx:model-event',
      for: 'wx:for',
      forIndex: 'wx:for-index',
      forItem: 'wx:for-item',
      key: 'wx:key',
      dynamicClass: 'wx:class',
      dynamicStyle: 'wx:style'
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
    stringify (str) {
      return `'${str}'`
    },
    event: {
      bindReg: /^(?:on|catch)([A-Z].*)$/,
      getType (match) {
        return match[1].replace(/^./, function (match) {
          return match.toLowerCase()
        })
      },
      defaultModelProp: 'value',
      defaultModelEvent: 'input',
      getBind (eventName) {
        return 'on' + eventName.replace(/^./, (matched) => {
          return matched.toUpperCase()
        })
      },
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
    directive: {
      if: 'a:if',
      elseif: 'a:elif',
      else: 'a:else',
      model: 'a:model',
      modelProp: 'a:model-prop',
      modelEvent: 'a:model-event',
      for: 'a:for',
      forIndex: 'a:for-index',
      forItem: 'a:for-item',
      key: 'a:key',
      dynamicClass: 'a:class',
      dynamicStyle: 'a:style'
    }
  }
}
