import { createFilter, Plugin, UserConfig } from 'vite'
import createVuePlugin from '@vitejs/plugin-vue2'
import { Options, processOptions, ResolvedOptions } from './options'
import { parseRequest } from '@mpxjs/compile-utils'
import { stringifyObject } from '../utils/stringify'
import handleHotUpdate from './handleHotUpdate'
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
import { getDescriptor } from './utils/descriptorCache'

function createMpxPlugin(options: Options, userConfig?: UserConfig): Plugin {
  const resolvedOptions: ResolvedOptions = {
    ...options,
    base: '',
    sourceMap: false,
    isProduction: false
  }
  const { include, exclude } = options
  const filter = createFilter(include, exclude)

  return {
    name: 'vite:mpx',

    config() {
      return {
        ...userConfig,
        define: {
          global: 'globalThis', // polyfill node global
          'process.env.NODE_ENV': JSON.stringify(
            resolvedOptions.isProduction ? '"production"' : '"development"'
          ),
          ...userConfig?.define,
          ...stringifyObject(resolvedOptions.defs)
        }
      }
    },

    configResolved(config) {
      Object.assign(resolvedOptions, {
        base: config.base,
        sourceMap: config.command === 'build' ? !!config.build.sourcemap : true,
        isProduction: config.isProduction
      })
    },

    handleHotUpdate(ctx) {
      return handleHotUpdate(ctx)
    },

    async resolveId(id) {
      if (
        id === APP_HELPER_CODE ||
        id === I18N_HELPER_CODE ||
        id === TAB_BAR_PAGE_HELPER_CODE
      ) {
        return id
      }
    },

    load(id) {
      if (id === APP_HELPER_CODE && mpxGlobal.entry) {
        const { resourcePath: filename } = parseRequest(mpxGlobal.entry)
        const descriptor = getDescriptor(filename)
        if (descriptor) {
          return renderAppHelpCode(resolvedOptions, descriptor)
        }
      }
      if (id === TAB_BAR_PAGE_HELPER_CODE && mpxGlobal.entry) {
        const { resourcePath: filename } = parseRequest(mpxGlobal.entry)
        const descriptor = getDescriptor(filename)
        if (descriptor) {
          return renderTabBarPageCode(resolvedOptions, descriptor, this)
        }
      }
      if (id === I18N_HELPER_CODE) {
        return renderI18nCode(resolvedOptions)
      }
      const { resourcePath: filename, queryObj: query } = parseRequest(id)
      if (query.resolve !== undefined) {
        return renderPageRouteCode(resolvedOptions, filename)
      }
      if (query.type === 'globalDefine') {
        const descriptor = getDescriptor(filename)
        if (descriptor) {
          return renderMpxPresetCode(resolvedOptions, descriptor)
        }
      }
    },

    async transform(code, id) {
      const { queryObj: query, resourcePath: filename } = parseRequest(id)
      if (!filter(filename)) return
      if (query.resolve !== undefined) return
      if (query.vue === undefined) {
        // mpx file => vue file
        return await transformMain(code, filename, query, resolvedOptions, this)
      } else {
        if (query.type === 'style') {
          // mpx style => vue style
          const descriptor = getDescriptor(filename)
          if (descriptor) {
            return await transformStyle(
              code,
              filename,
              descriptor,
              resolvedOptions,
              this
            )
          }
        }
        if (query.type === 'main') {
          await transformMain(code, filename, query, resolvedOptions, this)
          return 'export default {}'
        }
      }
    }
  }
}

export default function mpx(options: Partial<Options> = {}): Plugin[] {
  const baseOptions = processOptions({ ...options })
  const { mode = '', env = '', fileConditionRules } = baseOptions
  const customExtensions = [mode, env, env && `${mode}.${env}`].filter(Boolean)
  const plugins = [
    // split subpackage chunk
    createSplitPackageChunkPlugin(),
    // add custom extensions
    customExtensionsPlugin({
      include: /@mpxjs|\.mpx/,
      fileConditionRules,
      extensions: customExtensions
    }),
    // ensure mpx entry point
    createResolveEntryPlugin(baseOptions),
    // wxs => js
    createWxsPlugin(),
    // mpx => vue
    createMpxPlugin(baseOptions, {
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
    // vue support for mpxjs/rumtime
    createVuePlugin({
      include: /\.vue|\.mpx$/
    })
  ]

  return plugins
}
