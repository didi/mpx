/**
 * Fork from @tarojs/shared for generating base template
 * 
 * 这里我们需要关心的小程序种类有两类：
 * 1. 模板递归：
 *  - 支持：tmpl0 套 tmpl0
 *  - 不支持：这就使得我们必须生成多级的模板，tmpl0 套 tmpl1，tmpl1 套 tmpl2……
 *           直到超过阈值 N (N = config.miniapp.baseLevel) tmplN 会套组件 comp，组件 comp 重新再套 tmpl0。
 * 2. 小程序脚本语言（wxs, sjs, etc...）：
 *  - 支持：可以在模板使用函数缩减模板大小或提高性能（存疑），例如判断一个值是不是假值（falsy value）。
 *         将来或许会把数据序列化^1 的操作也放到小程序脚本语言里。
 *  - 不支持：使用纯 *xml 语法
 *
*/
import {
  internalComponents,
  focusComponents,
  voidElements,
  nestElements,
  styles,
  events,
  singleQuote
} from './components'
import { Shortcuts } from './shortcuts'
import { isBooleanStringLiteral, isNumber, isFunction } from './is'
import { toCamelCase, toKebabCase, toDashed, hasOwn } from './utils'

interface Component {
  nodeName: string;
  attributes: Attributes;
}

interface Components {
  [key: string]: Record<string, string>;
}

interface ComponentConfig {
  includes: Set<string>
  exclude: Set<string>
  thirdPartyComponents: Map<string, Set<string>>
  runtimeComponents: Map<string, Set<string>>
  includeAll: boolean
  internalComponents: Map<string, Set<string>>
}

export interface IAdapter {
  if: string;
  else: string;
  elseif: string;
  for: string;
  forItem: string;
  forIndex: string;
  key: string;
  xs?: string,
  type: string;
}

export type Attributes = Record<string, string>

const weixinAdapter: IAdapter = {
  if: 'wx:if',
  else: 'wx:else',
  elseif: 'wx:elif',
  for: 'wx:for',
  forItem: 'wx:for-item',
  forIndex: 'wx:for-index',
  key: 'wx:key',
  xs: 'wxs',
  type: 'weapp'
}

export class BaseTemplate {
  protected exportExpr = 'module.exports ='
  protected isSupportRecursive: boolean
  protected supportXS = false // 是否支持小程序的 wxs 语法
  protected miniComponents: Components
  protected modifyCompProps?: (compName: string, target: Record<string, string>) => Record<string, string>
  protected modifyLoopBody?: (child: string, nodeName: string) => string
  protected modifyLoopContainer?: (children: string, nodeName: string) => string
  protected modifyTemplateResult?: (res: string, nodeName: string, level: number, children: string) => string

  public Adapter = weixinAdapter
  /** 组件列表 */
  public internalComponents = internalComponents
  /** 可以 focus 聚焦的组件 */
  public focusComponents: Set<string> = focusComponents
  /** 不需要渲染子节点的元素 */
  public voidElements: Set<string> = voidElements
  /** 可以递归调用自身的组件 */
  public nestElements: Map<string, number> = nestElements

  private buildAttribute (attrs: Attributes, nodeName: string): string {
    return Object.keys(attrs)
      .map(k => {
        if (k === 'rawTag') {
          return ''
        }
        return `${k}="${k.startsWith('bind') || k.startsWith('on') || k.startsWith('catch') || k.startsWith('capture') ? attrs[k] : `{${this.getAttrValue(attrs[k], k, nodeName)}}`}" `
      })
      .join('')
  }

  protected replacePropName (name: string, value: string, _componentName?: string) {
    if (value === '__invoke') return name.toLowerCase()
    return name
  }

  protected createMiniComponents (components) {
    const result = Object.create(null)

    for (const key in components) {
      if (hasOwn(components, key)) {
        let component = components[key]
        const compName = toDashed(key)
        const newComp: Record<string, string> = Object.create(null)

        if (isFunction(this.modifyCompProps)) {
          component = this.modifyCompProps(compName, component)
        }

        for (let prop in component) {
          if (hasOwn(component, prop)) {
            let propValue = component[prop]
            // 事件绑定
            if (/^(bind|catch|capture-bind|capture-catch):?(.*?)(?:\.(.*))?$/.exec(prop)) {
              propValue = '__invoke'
            } else if (prop === 'rawTag') {
              // do nothing
            } else if (propValue === '') {
              // <button primary></button> 单属性值的处理
              propValue = `i.data.${toCamelCase(prop)}`
            } else if (isBooleanStringLiteral(propValue) || isNumber(+propValue)) {
              propValue = this.supportXS
                ? `xs.b(i.data.${toCamelCase(prop)},${propValue})`
                : `i.data.${toCamelCase(prop)}===undefined?${propValue}:i.data.${toCamelCase(prop)}`
            } else {
              propValue = `i.data.${toCamelCase(prop)}||${propValue || singleQuote('')}`
            }

            prop = this.replacePropName(prop, propValue, compName)

            newComp[prop] = propValue
          }
        }

        // TODO：可以优化？不一定需要默认添加这些属性，可以按需
        // 添加默认的属性，style / class / events 相关
        if (compName !== 'block') {
          Object.assign(newComp, styles, this.getEvents())
        }

        // swiper-item 去除 style 配置
        if (compName === 'swiper-item') {
          delete newComp.style
        }

        if (compName === 'slot' || compName === 'slot-view') {
          result[compName] = {
            slot: 'i.data.name'
          }
        } else {
          result[compName] = newComp
        }
      }
    }

    return result
  }

  // 递归生成基础模板，被注入到 base.wxml 当中的文本内容
  protected buildBaseTemplate () {
    return `${this.buildXsTemplate()}
<template name="mpx_tmpl">
  <element r="{{r}}" wx:if="{{r}}"></element>
</template>
`
  }

  protected buildThirdPartyAttr (attrs: Set<string>) {
    return Array.from(attrs).reduce((str, attr) => {
      if (attr.startsWith('@')) {
        // vue2
        let value = attr.slice(1)
        if (value.indexOf('-') > -1) {
          value = `:${value}`
        }
        return str + `bind${value}="__invoke" `
      } else if (attr.startsWith('bind')) { // 事件统一走代理的模式
        return str + `${attr}="__invoke" `
      } else if (attr.startsWith('on')) {
        // react, vue3
        let value = toKebabCase(attr.slice(2))
        if (value.indexOf('-') > -1) {
          // 兼容如 vant 某些组件的 bind:a-b 这类属性
          value = `:${value}`
        }
        return str + `bind${value}="__invoke" `
      }

      let strVal = ''
      switch (attr) {
        case 'mpxAttrs':
          strVal = '"{{ i.data }}"'
          break
        case 'mpxShow':
          strVal = '"{{ i.data.mpxShow === undefined ? true : i.data.mpxShow }}"'
          break
        default:
          strVal = `"{{ i.data.${toCamelCase(attr)} }}"`
          break
      }

      return str + `${attr}=${strVal} `
    }, '')
  }

  protected buildComponentTemplate (comp: Component, level: number) {
    return this.focusComponents.has(comp.nodeName)
      ? this.buildFocusComponentTemplte(comp, level)
      : this.buildStandardComponentTemplate(comp, level)
  }

  private getChildren (comp: Component, level: number): string {
    const { isSupportRecursive, Adapter, supportXS } = this
    const nextLevel = isSupportRecursive ? 0 : level + 1

    const data = !this.isSupportRecursive && supportXS
      ? `${this.dataKeymap('i:item,l:l')}`
      : this.dataKeymap('i:item')

    let child = supportXS
      ? `<template is="{{xs.e(${isSupportRecursive ? 0 : 'cid+1'})}}" data="{{${data}}}" />`
      : `<template is="tmpl_${nextLevel}_${Shortcuts.Container}" data="{{${data}}}" />`

    if (isFunction(this.modifyLoopBody)) {
      child = this.modifyLoopBody(child, comp.nodeName)
    }

    let children = this.voidElements.has(comp.nodeName)
      ? ''
      : `
    <block ${Adapter.for}="{{i.${Shortcuts.Children}}}" ${Adapter.key}="index">
      ${child}
    </block>
  `

    if (isFunction(this.modifyLoopContainer)) {
      children = this.modifyLoopContainer(children, comp.nodeName)
    }

    return children
  }

  protected buildFocusComponentTemplte (comp: Component, level: number) {
    const children = this.getChildren(comp, level)

    const attrs = { ...comp.attributes }
    const templateName = this.supportXS
      ? `xs.c(i, 'tmpl_${level}_')`
      : `i.focus ? 'tmpl_${level}_${comp.nodeName}_focus' : 'tmpl_${level}_${comp.nodeName}_blur'`
    delete attrs.focus

    let res = `
<template name="tmpl_${level}_${comp.nodeName}">
  <template is="{{${templateName}}}" data="{{${this.dataKeymap('i:i')}${children ? ',cid:cid' : ''}}}" />
</template>

<template name="tmpl_${level}_${comp.nodeName}_focus">
  <${comp.nodeName} ${this.buildAttribute(comp.attributes, comp.nodeName)} data-mid="{{i.data.moduleId}}">${children}</${comp.nodeName}>
</template>

<template name="tmpl_${level}_${comp.nodeName}_blur">
  <${comp.nodeName} ${this.buildAttribute(attrs, comp.nodeName)} data-mid="{{i.data.moduleId}}">${children}</${comp.nodeName}>
</template>
`
    if (isFunction(this.modifyTemplateResult)) {
      res = this.modifyTemplateResult(res, comp.nodeName, level, children)
    }

    return res
  }

  protected buildStandardComponentTemplate (comp: Component, level: number) {
    const children = this.getChildren(comp, level)

    let nodeName = ''
    switch (comp.nodeName) {
      case 'slot':
      case 'slot-view':
      case 'catch-view':
      case 'static-view':
      case 'pure-view':
        nodeName = 'view'
        break
      case 'static-text':
        nodeName = 'text'
        break
      case 'static-image':
        nodeName = 'image'
        break
      default:
        if (comp.attributes.rawTag) {
          nodeName = comp.attributes.rawTag
        } else {
          nodeName = comp.nodeName
        }
        break
    }

    let res = `
<template name="tmpl_${level}_${comp.nodeName}">
  <${nodeName} ${this.buildAttribute(comp.attributes, comp.nodeName)} data-mid="{{i.data.moduleId}}">${children}</${nodeName}>
</template>
`

    if (isFunction(this.modifyTemplateResult)) {
      res = this.modifyTemplateResult(res, comp.nodeName, level, children)
    }

    return res
  }

  protected buildPlainTextTemplate (level: number): string {
    return `
<template name="tmpl_${level}_#text" data="{{${this.dataKeymap('i:i')}}}">
  <block>{{i.${Shortcuts.TextNew}}}</block>
</template>
`
  }

  // 包括 custom-wrapper、原生的小程序组件、第三方(例如 vant)的组件
  protected buildThirdPartyTemplate (level: number, componentConfig: ComponentConfig) {
    const { Adapter, isSupportRecursive, supportXS, nestElements } = this
    const nextLevel = isSupportRecursive ? 0 : level + 1
    let template = ''

    const data = !isSupportRecursive && supportXS
      ? `${this.dataKeymap('i:item,l:l')}`
      : this.dataKeymap('i:item')

    componentConfig.thirdPartyComponents.forEach((attrs, compName) => {
      if (compName === 'custom-wrapper') {
        template += `
<template name="tmpl_${level}_${compName}">
  <${compName} i="{{i}}" l="{{l}}" data-mid="{{i.data.moduleId}}">
  </${compName}>
</template>
  `
      } else {
        if (!isSupportRecursive && supportXS && nestElements.has(compName) && level + 1 > nestElements.get(compName)!) return

        const child = supportXS
          ? `<template is="{{xs.e(${isSupportRecursive ? 0 : 'cid+1'})}}" data="{{${data}}}" />`
          : `<template is="tmpl_${nextLevel}_${Shortcuts.Container}" data="{{${data}}}" />`

        // TODO: 需要根据组件的特性（非运行时/运行时组件）动态生成对应的模板内容
        template += `
<template name="tmpl_${level}_${compName}">
  <${compName} ${this.buildThirdPartyAttr(attrs)} data-mid="{{i.data.moduleId}}">
    <block ${Adapter.for}="{{i.${Shortcuts.Children}}}" ${Adapter.key}="index">
      <block wx:if="{{ item.data['slot'] }}">
        <view slot="{{ item.data['slot'] }}">
          ${child}
        </view>
      </block>
      <block wx:else>
        ${child}
      </block>
    </block>
  </${compName}>
</template>
  `
      }
    })

    componentConfig.runtimeComponents.forEach((attrs, compName) => {
      if (!isSupportRecursive && supportXS && nestElements.has(compName) && level + 1 > nestElements.get(compName)!) return
        
        template += `
<template name="tmpl_${level}_${compName}">
  <${compName} ${this.buildThirdPartyAttr(attrs)} data-mid="{{i.data.moduleId}}"></${compName}>
</template>
  `
    })

    return template
  }

  protected buildBlockTemplate (level: number) {
    const { Adapter, isSupportRecursive, supportXS } = this
    const nextLevel = isSupportRecursive ? 0 : level + 1
    const data = !isSupportRecursive && supportXS
      ? `${this.dataKeymap('i:item,l:\'\'')}`
      : this.dataKeymap('i:item')
    return `
<template name="tmpl_${level}_block">
  <block ${Adapter.for}="{{i.children}}" ${Adapter.key}="index">
    <template is="tmpl_${nextLevel}_${Shortcuts.Container}" data="{{${data}}}" />
  </block>
</template>
`
  }

  protected buildContainerTemplate (level: number, restart = false) {
    let tmpl = ''
    if (restart) {
      tmpl = `<block ${this.Adapter.if}="{{i.nodeType === '#text'}}">
    <template is="tmpl_0_#text" data="{{i:i}}" />
  </block>
  <block ${this.Adapter.else}>
    ${!this.isSupportRecursive && this.supportXS ? '<element i="{{i}}" l="{{l}}" />' : '<element r="{{i}}" />'}
  </block>`
    } else {
      const xs = !this.isSupportRecursive
        ? `xs.a(${level}, i.${Shortcuts.NodeTypeNew}, l)`
        : `xs.a(${level}, i.${Shortcuts.NodeTypeNew})`

      const data = !this.isSupportRecursive
        ? `${this.dataKeymap(`i:i,cid:${level},l:xs.f(l,i.${Shortcuts.NodeTypeNew})`)}`
        : `${this.dataKeymap('i:i')}`

      tmpl = this.supportXS
        ? `<template is="{{${xs}}}" data="{{${data}}}" />`
        : `<template is="{{'tmpl_${level}_' + i.${Shortcuts.NodeTypeNew}}}" data="{{${this.dataKeymap('i:i')}}}" />`
    }
    return `
<template name="tmpl_${level}_${Shortcuts.Container}">
  ${tmpl}
</template>
`
  }

  protected dataKeymap (keymap: string) {
    return keymap
  }

  protected getEvents (): any {
    return events
  }

  protected getAttrValue (value: string, _key: string, _nodeName: string) {
    return `{${value}}`
  }

  protected buildXsTemplate () {
    return ''
  }

  public buildPageTemplate = (baseTempPath: string) => {
    const template = `<import src="${baseTempPath}"/>
<template is="mpx_tmpl" data="{{${this.dataKeymap('r:r')}}}" />`

    return template
  }

  // 辅助模板递归渲染的 comp 模板
  public buildBaseComponentTemplate = (ext: string) => {
    const data = !this.isSupportRecursive && this.supportXS
      ? this.dataKeymap('i:i,l:l')
      : this.dataKeymap('i:i')

    return `<import src="./base${ext}" />
<template is="tmpl_0_${Shortcuts.Container}" data="{{${data}}}" />`
  }

  // 辅助自定义组件递归渲染的模板(custom-wrapper)
  public buildCustomComponentTemplate = (ext: string) => {
    const Adapter = this.Adapter
    const data = !this.isSupportRecursive && this.supportXS
      ? `${this.dataKeymap('i:item,l:\'\'')}`
      : this.dataKeymap('i:item')
    return `<import src="./base${ext}" />
  <block ${Adapter.for}="{{i.${Shortcuts.Children}}}" ${Adapter.key}="index">
    <template is="tmpl_0_container" data="{{${data}}}" />
  </block>`
  }

  public buildXScript = () => {
    return `${this.exportExpr} {
  a: ${this.buildXSTmplName()},
  b: function (a, b) {
    return a === undefined ? b : a
  },
  c: function(i, prefix) {
    var s = i.focus !== undefined ? 'focus' : 'blur'
    return prefix + i.${Shortcuts.NodeTypeNew} + '_' + s
  },
  d: function (i, v) {
    return i === undefined ? v : i
  },
  e: function (n) {
    return 'tmpl_' + n + '_${Shortcuts.Container}'
  },
  ${this.buildXSTmpExtra()}
}`
  }

  public mergeComponents (ctx, patch: Record<string, Record<string, string>>) {
    ctx.helper.recursiveMerge(this.internalComponents, patch)
  }

  protected buildXSTmplName () {
    return `function (l, n) {
    return 'tmpl_' + l + '_' + n
  }`
  }

  protected buildXSTmpExtra () {
    return ''
  }
}

export class RecursiveTemplate extends BaseTemplate {
  isSupportRecursive = true

  public buildTemplate = (componentConfig: ComponentConfig) => {
    let template = this.buildBaseTemplate()
    this.miniComponents = this.createMiniComponents(componentConfig)
    const ZERO_FLOOR = 0
    const components = Object.keys(this.miniComponents)
      .filter(c => componentConfig.includes.size && !componentConfig.includeAll ? componentConfig.includes.has(c) : true)

    template = components.reduce((current, nodeName) => {
      const attributes: Attributes = this.miniComponents[nodeName]
      return current + this.buildComponentTemplate({ nodeName, attributes }, ZERO_FLOOR)
    }, template)

    template += this.buildPlainTextTemplate(ZERO_FLOOR)
    template += this.buildThirdPartyTemplate(ZERO_FLOOR, componentConfig)
    template += this.buildContainerTemplate(ZERO_FLOOR)

    return template
  }
}

export class UnRecursiveTemplate extends BaseTemplate {
  isSupportRecursive = false
  private _baseLevel = 8
  private componentConfig: ComponentConfig

  set baseLevel (lv) {
    this._baseLevel = lv
  }

  get baseLevel () {
    return this._baseLevel
  }

  public buildTemplate = (componentConfig: ComponentConfig) => {
    this.componentConfig = componentConfig
    // createMiniComponents 方法会创建出 view -> static-view / pure-view | text -> static-text 等节点的配置
    // miniComponents 包含了需要被渲染出来的组件
    this.miniComponents = this.createMiniComponents(componentConfig.internalComponents)

    const components = Object.keys(this.miniComponents)

    let template = this.buildBaseTemplate() // 生成入口模板
    for (let i = 0; i < this.baseLevel; i++) { // 生成层级模板
      template += this.supportXS
        ? this.buildOptimizeFloor(i, components, this.baseLevel === i + 1)
        : this.buildFloor(i, components, this.baseLevel === i + 1)
    }

    return template
  }

  protected buildFloor (level: number, components: string[], restart = false) {
    if (restart) return this.buildContainerTemplate(level, restart)

    let template = this.buildBlockTemplate(level)

    template += components.reduce((current, nodeName) => {
      const attributes: Attributes = this.miniComponents[nodeName]
      return current + this.buildComponentTemplate({ nodeName, attributes }, level)
    }, '')

    template += this.buildPlainTextTemplate(level)
    template += this.buildThirdPartyTemplate(level, this.componentConfig)
    template += this.buildContainerTemplate(level, restart)

    return template
  }

  protected buildOptimizeFloor (level: number, components: string[], restart = false) {
    if (restart) return this.buildContainerTemplate(level, restart)

    let template = components.reduce((current, nodeName) => {
      if (level !== 0) {
        if (!this.nestElements.has(nodeName)) {
          // 不可嵌套自身的组件只需输出一层模板 -> 例如 slider、switch 这种功能组件
          return current
        } else {
          // 部分可嵌套自身的组件实际上不会嵌套过深，这里按阈值限制层数 -> 例如 scroll-view、swiper 这种可自身嵌套的组件
          const max = this.nestElements.get(nodeName)!
          if (max > 0 && level >= max) {
            return current
          }
        }
      }
      // 根据 nodeName 和 attributes 来构建模板
      const attributes: Attributes = this.miniComponents[nodeName]
      return current + this.buildComponentTemplate({ nodeName, attributes }, level)
    }, '')

    // <text> 节点模板
    if (level === 0) template += this.buildPlainTextTemplate(level)
    // 构建自定义组件的模板
    template += this.buildThirdPartyTemplate(level, this.componentConfig)
    template += this.buildContainerTemplate(level)

    return template
  }

  protected buildXSTmplName () {
    const isLoopComps = [
      ...Array.from(this.nestElements.keys()),
      ...Array.from(this.componentConfig.thirdPartyComponents.keys()),
      ...Array.from(this.componentConfig.runtimeComponents.keys())
    ]
    const isLoopCompsSet = new Set(isLoopComps) // 可递归循环的组件
    const hasMaxComps: string[] = [] // 有最大递归循环数限制的组件
    this.nestElements.forEach((max, comp) => {
      if (max > 1) {
        hasMaxComps.push(comp)
      } else if (max === 1 && isLoopCompsSet.has(comp)) {
        isLoopCompsSet.delete(comp)
      }
    })
    return `function (l, n, s) {
    var a = ${JSON.stringify(Array.from(isLoopCompsSet))}
    var b = ${JSON.stringify(hasMaxComps)}
    if (a.indexOf(n) === -1) {
      l = 0
    }
    if (b.indexOf(n) > -1) {
      var u = s.split(',')
      var depth = 0
      for (var i = 0; i < u.length; i++) {
        if (u[i] === n) depth++
      }
      l = depth
    }
    return 'tmpl_' + l + '_' + n
  }`
  }

  protected buildXSTmpExtra () {
    const hasMaxComps: string[] = []
    this.nestElements.forEach((max, comp) => {
      if (max > 1) hasMaxComps.push(comp)
    })
    return `f: function (l, n) {
    var b = ${JSON.stringify(hasMaxComps)}
    if (b.indexOf(n) > -1) {
      if (l) l += ','
      l += n
    }
    return l
  }`
  }
}
