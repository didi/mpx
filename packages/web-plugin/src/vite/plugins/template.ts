import { ParseHtmlNode } from '@mpxjs/compiler'
import genComponentTag from '@mpxjs/compile-utils/gen-component-tag'
import path from 'path'
import { TransformPluginContext } from 'rollup'
import { TransformResult } from 'vite'
import { compileSFCTemplate as vueTransformTemplate } from 'vite-plugin-vue2/dist/template.js'
import { ResolvedOptions } from '../../options'
import * as normalize from '@mpxjs/compile-utils/normalize'
import templateCompiler, { SFCDescriptor } from '../compiler'

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

const mpxKeepAlivePath = normalize.runtime('components/web/mpx-keep-alive.vue')
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
        warn: msg => {
          pluginContext?.warn('[template compiler]: ' + msg)
        },
        error: msg => {
          pluginContext?.error('[template compiler]: ' + msg)
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
          templateCompiler.addAttrs(parsed.root, [{
            name: 'class',
            value: 'mpx-root-view'
          }])
        }
      }

      if (parsed.meta.wxsModuleMap) {
        wxsModuleMap = parsed.meta.wxsModuleMap
      }

      if (parsed.meta.wxsContentMap) {
        for (const module in parsed.meta.wxsContentMap) {
          wxsContentMap[`${filename}~${module}`] =
            parsed.meta.wxsContentMap[module]
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
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    output: genComponentTag(descriptor.template!)
  }
}
