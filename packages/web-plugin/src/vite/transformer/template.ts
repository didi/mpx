import path from 'path'
import { TransformPluginContext } from 'rollup'
import { TransformResult } from 'vite'
import genComponentTag from '@mpxjs/utils/gen-component-tag'
import { ParseHtmlNode } from '@mpxjs/compiler'
import { compileSFCTemplate as vueTransformTemplate } from 'vite-plugin-vue2/dist/template.js'
import { ResolvedOptions } from '../../options'
import templateCompiler, { SFCDescriptor } from '../compiler'
import { resolveMpxRuntime } from '../../utils/resolveMpxRuntime'

const templateTransformCache: Record<string, string> = {}

function calculateRootEleChild(arr: ParseHtmlNode[]) {
  if (!arr) return 0
  return arr.reduce((total: number, item: ParseHtmlNode) => {
    if (item.type === 1) {
      if (item.tag === 'template') {
        total += calculateRootEleChild(item.children)
      } else {
        total += 1
      }
    }
    return total
  }, 0)
}

/**
 * transform mpx template to vue template
 * @param code - mpx template code
 * @param filename - filename
 * @param descriptor - SFCDescriptor
 * @param options - ResolvedOptions
 * @param pluginContext - TransformPluginContext
 */
export async function transformTemplate(
  code: string,
  filename: string,
  descriptor: SFCDescriptor,
  options: ResolvedOptions,
  pluginContext: TransformPluginContext
): Promise<TransformResult | undefined> {
  if (descriptor.template) {
    return await vueTransformTemplate(
      templateTransformCache[filename], // use processTemplate transform cache
      descriptor.template,
      filename,
      options,
      pluginContext
    )
  }
}

const mpxKeepAlivePath = resolveMpxRuntime('components/web/mpx-keep-alive.vue')
/**
 * collect template buildInComponent
 * @param descriptor - SFCDescriptor
 * @param options - ResolvedOptions
 * @param pluginContext - TransformPluginContext
 */
export function processTemplate(
  descriptor: SFCDescriptor,
  options: ResolvedOptions,
  pluginContext?: TransformPluginContext
): void {
  const {
    mode,
    srcMode,
    defs,
    decodeHTMLText,
    externalClasses,
    checkUsingComponents
  } = options
  const { id, filename, jsonConfig, app, template } = descriptor
  const { usingComponents = {}, componentGenerics = {} } = jsonConfig
  const builtInComponentsMap: SFCDescriptor['builtInComponentsMap'] = {}
  let genericsInfo: SFCDescriptor['genericsInfo']
  const wxsContentMap: SFCDescriptor['wxsContentMap'] = {}
  let wxsModuleMap: SFCDescriptor['wxsModuleMap'] = {}

  if (template) {
    function addBuildComponent(name: string, resource: string) {
      builtInComponentsMap[name] = builtInComponentsMap[name] || {}
      Object.assign(builtInComponentsMap[name], { resource })
    }

    if (app) {
      addBuildComponent('mpx-keep-alive', mpxKeepAlivePath)
      templateTransformCache[filename] = template.content
    } else {
      const parsed = templateCompiler.parse(template.content, {
        warn: (msg) => {
          pluginContext?.warn(
            new Error('[template compiler][' + filename + ']: ' + msg)
          )
        },
        error: (msg) => {
          pluginContext?.error('[template compiler][' + filename + ']: ' + msg)
        },
        usingComponents: Object.keys(usingComponents),
        componentGenerics,
        hasComment: !!template?.attrs?.comments,
        isNative: false,
        basename: path.basename(filename),
        isComponent: !app,
        mode,
        srcMode: template.mode || srcMode,
        defs,
        decodeHTMLText,
        externalClasses,
        checkUsingComponents,
        hasScoped: false,
        moduleId: id,
        filePath: filename,
        i18n: null,
        globalComponents: []
      })

      /**
       * 
       * {
  '/Users/materbxh/Program/CodeRead/mpx-web/examples/mpx-transform-web/src/pages/wxs.mpx~foo': 'var some_msg = "hello world";\n' +
    '      module.exports = {\n' +
    '        msg : some_msg,\n' +
    '      }'
}
       *  {
  foo: '~/Users/materbxh/Program/CodeRead/mpx-web/examples/mpx-transform-web/src/pages/wxs.mpx.wxs!=!/Users/materbxh/Program/CodeRead/mpx-web/examples/mpx-transform-web/src/pages/wxs.mpx?wxsModule=foo',
  hello: '../components/hello.wxs'
}
       *   import processOption, { getComponent, getWxsMixin } from "@mpxjs/web-plugin/src/runtime/optionProcessor"
  const wxsModules = {}
  wxsModules.foo = require("./wxs.mpx.wxs!=!./wxs.mpx?wxsModule=foo")
  wxsModules.hello = require("../components/hello.wxs")
       */
      

      if (parsed.meta.builtInComponentsMap) {
        Object.entries(parsed.meta.builtInComponentsMap).forEach(
          ([name, resource]) => addBuildComponent(name, resource)
        )
      }

      genericsInfo = parsed.meta.genericsInfo

      if (parsed.root.tag === 'temp-node') {
        const childLen = calculateRootEleChild(parsed.root.children)
        if (childLen >= 2) {
          parsed.root.tag = 'div'
        }
      }

      if (parsed.meta.wxsModuleMap) {
        wxsModuleMap = parsed.meta.wxsModuleMap
      }
      
      if (parsed.meta.wxsContentMap) {
        for (const module in parsed.meta.wxsContentMap) {
          wxsContentMap[`${filename}~${module}`] = parsed.meta.wxsContentMap[module]
        }
      }

      templateTransformCache[filename] = templateCompiler.serialize(parsed.root)
    }
  }

  descriptor.wxsModuleMap = wxsModuleMap
  descriptor.wxsContentMap = wxsContentMap
  descriptor.genericsInfo = genericsInfo
  descriptor.builtInComponentsMap = builtInComponentsMap
}

/**
 * gen template block
 * @param descriptor - SFCDescriptor
 * @returns <template>descriptor.template.content</template>
 */
export function genTemplateBlock(descriptor: SFCDescriptor): {
  output: string
} {
  return {
    output: genComponentTag(descriptor.template)
  }
}
