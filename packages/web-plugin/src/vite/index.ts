import { createFilter, Plugin, UserConfig } from 'vite'
import { createVuePlugin } from 'vite-plugin-vue2'
import { Options, processOptions, ResolvedOptions } from '../options'
import parseRequest from '@mpxjs/compile-utils/parse-request'
import { stringifyObject } from '../utils/stringify'
import handleHotUpdate from './handleHotUpdate'
import hash from 'hash-sum'
import path from 'path'
import {
  APP_HELPER_CODE,
  I18N_HELPER_CODE,
  renderAppHelpCode,
  renderI18nCode,
  renderMpxPresetCode,
  renderPageRouteCode,
  renderTabBarPageCode,
  TAB_BAR_PAGE_HELPER_CODE
} from './helper'
import mpxGlobal from './mpx'
import {
  customExtensionsPlugin,
  esbuildCustomExtensionsPlugin
} from './plugins/addExtensionsPlugin'
import { createResolveEntryPlugin } from './plugins/resolveEntryPlugin'
import { createSplitPackageChunkPlugin } from './plugins/splitPackageChunkPlugin'
import { createWxsPlugin } from './plugins/wxsPlugin'
import { transformMain } from './transformer/main'
import { transformStyle } from './transformer/style'
import { transformTemplate } from './transformer/template'
import { getDescriptor } from './utils/descriptorCache'

function createMpxPlugin(
  options: ResolvedOptions,
  userConfig?: UserConfig
): Plugin {
  const { include, exclude } = options
  const filter = createFilter(include, exclude)

  const mpxVuePlugin = createVuePlugin({
    include
  })

  return {
    name: 'vite:mpx',

    config() {
      return {
        ...userConfig,
        define: {
          global: 'globalThis', // polyfill node global
          'process.env.NODE_ENV': JSON.stringify(
            options.isProduction ? '"production"' : '"development"'
          ),
          ...userConfig?.define,
          ...stringifyObject(options.defs)
        }
      }
    },

    configureServer(server) {
      options.devServer = server
    },

    configResolved(config) {
      Object.assign(options, {
        ...options,
        base: config.base,
        root: config.root,
        sourceMap: config.command === 'build' ? !!config.build.sourcemap : true,
        isProduction: config.isProduction
      })
    },

    handleHotUpdate(ctx) {
      return handleHotUpdate(ctx, options)
    },

    async resolveId(id, ...args) {
      if (
        id === APP_HELPER_CODE ||
        id === I18N_HELPER_CODE ||
        id === TAB_BAR_PAGE_HELPER_CODE
      ) {
        return id
      }
      // return vue resolveId
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      return mpxVuePlugin.resolveId?.call(this, id, ...args)
    },

    load(id) {
      if (id === APP_HELPER_CODE && mpxGlobal.entry) {
        const { resourcePath: filename } = parseRequest(mpxGlobal.entry)
        const descriptor = getDescriptor(filename)
        if (descriptor) {
          return renderAppHelpCode(options, descriptor)
        }
      }
      if (id === TAB_BAR_PAGE_HELPER_CODE && mpxGlobal.entry) {
        const { resourcePath: filename } = parseRequest(mpxGlobal.entry)
        const descriptor = getDescriptor(filename)
        if (descriptor) {
          return renderTabBarPageCode(options, descriptor, this)
        }
      }
      if (id === I18N_HELPER_CODE) {
        return renderI18nCode(options)
      }
      const { resourcePath: filename, queryObj: query } = parseRequest(id)
      if (query.resolve !== undefined) {
        return renderPageRouteCode(options, filename)
      }
      if (query.mpx !== undefined) {
        const descriptor = getDescriptor(filename)
        if (descriptor) {
          let block
          if (query.type === 'template') {
            block = descriptor.template
          } else if (query.type === 'style') {
            block = descriptor.styles[Number(query.index)]
          } else if (query.type === 'global'){
            block = {
              content: renderMpxPresetCode(descriptor, options)
            }
          }
          if (block) {
            return block.content
          }
        }
      }
      // return vue load
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      return mpxVuePlugin.load?.call(this, id)
    },

    async transform(code, id) {
      const { queryObj: query, resourcePath: filename } = parseRequest(id)
      if (!filter(filename)) return
      if (query.resolve !== undefined) return
      if (query.mpx === undefined) {
        // mpx file => vue file
        return await transformMain(code, filename, query, options, this)
      } else {
        if (query.type === 'template') {
          // mpx template => vue template
          const descriptor = getDescriptor(filename)
          if (descriptor) {
            return await transformTemplate(
              code,
              filename,
              descriptor,
              options,
              this
            )
          }
        }
        if (query.type === 'style') {
          // mpx style => vue style
          const descriptor = getDescriptor(filename)
          if (descriptor) {
            return await transformStyle(
              code,
              filename,
              descriptor,
              options,
              Number(query.index),
              this
            )
          }
        }
      }
    }
  }
}

export default function mpx(options: Options = {}): Plugin[] {
  const resolvedOptions = processOptions({ ...options })
  const { mode, env, fileConditionRules } = resolvedOptions
  const customExtensions = [mode, env, env && `${mode}.${env}`].filter(Boolean)
  mpxGlobal.pathHash = (resourcePath) => {
    if (options.pathHashMode === 'relative' && options.projectRoot) {
      return hash(path.relative(options.projectRoot, resourcePath))
    }
    return hash(resourcePath)
  }
  mpxGlobal.getOutputPath = (resourcePath, type, { ext = '', conflictPath = '' } = {}) => {
    const name = path.parse(resourcePath).name
    const hash = mpxGlobal.pathHash(resourcePath)
    const customOutputPath = options.customOutputPath
    if (conflictPath) return conflictPath.replace(/(\.[^\\/]+)?$/, match => hash + match)
    if (typeof customOutputPath === 'function') return customOutputPath(type, name, hash, ext).replace(/^\//, '')
    if (type === 'component' || type === 'page') return path.join(type + 's', name + hash, 'index' + ext)
    return path.join(type, name + hash + ext)
  }
  const plugins = [
    // mpx => vue
    createMpxPlugin(resolvedOptions, {
      optimizeDeps: {
        esbuildOptions: {
          plugins: [
            // prebuild for addExtensions
            esbuildCustomExtensionsPlugin({
              include: /@mpxjs/,
              fileConditionRules,
              extensions: customExtensions
            })
          ]
        }
      }
    }),
    createWxsPlugin(),
    // add custom extensions
    customExtensionsPlugin({
      include: /@mpxjs|\.mpx/,
      fileConditionRules,
      extensions: customExtensions
    }),
    // ensure mpx entry point
    createResolveEntryPlugin(resolvedOptions),
    // split subpackage chunk
    createSplitPackageChunkPlugin(),
    // vue support for mpxjs/rumtime
    createVuePlugin()
  ]

  return plugins
}
