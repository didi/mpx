const UnRecursiveTemplate = require('/Users/didi/project/taro/packages/shared/dist/template').UnRecursiveTemplate

const unRecursiveTemplate = new UnRecursiveTemplate()

const baseTemplate = unRecursiveTemplate.buildBaseComponentTemplate('wxs')

const template = unRecursiveTemplate.buildTemplate({
  includes: new Set([
    'view',
    'catch-view',
    'static-view',
    'pure-view',
    'scroll-view',
    'image',
    'static-image',
    'text',
    'static-text'
  ]),
  exclude: new Set(),
  thirdPartyComponents: new Map(),
  includeAll: false
})

const customWrapperTemplate = unRecursiveTemplate.buildCustomComponentTemplate('wxs')

console.log('the customWrapperTemplate is:', template)