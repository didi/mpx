import path from 'path'
import { TransformPluginContext } from 'rollup'
import { TransformResult } from 'vite'
import genComponentTag from '@mpxjs/webpack-plugin/lib/utils/gen-component-tag'
import { ParseHtmlNode } from '@mpxjs/webpack-plugin/lib/template-compiler/compiler'
import { compileSFCTemplate as vueTransformTemplate } from 'vite-plugin-vue2/dist/template'
import { ResolvedOptions } from '../options'
import templateCompiler, { SFCDescriptor } from '../compiler'
import { resolveMpxRuntime } from '../utils/resolveMpx'

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

      templateTransformCache[filename] = templateCompiler.serialize(parsed.root)
    }
  }

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
