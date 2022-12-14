import { ParseHtmlNode } from '@mpxjs/compiler'
import genComponentTag from '@mpxjs/compile-utils/gen-component-tag'
import path from 'path'
import { PluginContext } from 'rollup'
import { TransformResult } from 'vite'
import { ResolvedOptions } from '../../options'
import * as normalize from '@mpxjs/compile-utils/normalize'
import templateCompiler, { SFCDescriptor } from '../compiler'

const mpxKeepAlivePath = normalize.runtime('components/web/mpx-keep-alive.vue')

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
  descriptor: SFCDescriptor,
  options: ResolvedOptions,
  pluginContext: PluginContext
): Promise<TransformResult | undefined> {
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

  let result

  if (template) {
    function addBuildComponent(name: string, resource: string) {
      builtInComponentsMap[name] = builtInComponentsMap[name] || {}
      Object.assign(builtInComponentsMap[name], { resource })
    }

    if (app) {
      addBuildComponent('mpx-keep-alive', mpxKeepAlivePath)
      result = {
        code: template.content,
        map: null
      }
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
          templateCompiler.addAttrs(parsed.root, [
            {
              name: 'class',
              value: 'mpx-root-view'
            }
          ])
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

      result = {
        code: templateCompiler.serialize(parsed.root),
        map: null
      }
    }
  }

  descriptor.wxsModuleMap = wxsModuleMap
  descriptor.wxsContentMap = wxsContentMap
  descriptor.genericsInfo = genericsInfo
  descriptor.builtInComponentsMap = builtInComponentsMap

  return result
}

/**
 * gen template block
 * @param descriptor - SFCDescriptor
 * @returns <template>descriptor.template.content</template>
 */
export async function genTemplateBlock(
  descriptor: SFCDescriptor,
  options: ResolvedOptions,
  pluginContext: PluginContext
): Promise<{
  output: string
}> {
  const templateContent = await transformTemplate(
    descriptor,
    options,
    pluginContext
  )
  return {
    output: genComponentTag({
      content: templateContent?.code,
      tag: 'template',
      attrs: descriptor.template?.attrs
    })
  }
}
