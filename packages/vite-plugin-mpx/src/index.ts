import { Plugin, UserConfig } from 'vite'
import { createFilter } from '@rollup/pluginutils'
import { createVuePlugin } from 'vite-plugin-vue2'
import replace from '@rollup/plugin-replace'
import nodePolyfills from 'rollup-plugin-polyfill-node'
import commonjs from '@rollup/plugin-commonjs'
import mpxGlobal from './mpx'
import { transformMain } from './transformer/main'
import { transformTemplate } from './transformer/template'
import { transformStyle } from './transformer/style'
import handleHotUpdate from './handleHotUpdate'
import {
  APP_HELPER_CODE,
  renderAppHelpCode,
  renderPageRouteCode
} from './helper'
import { processOptions, Options, ResolvedOptions } from './options'
import {
  customExtensionsPlugin,
  esbuildCustomExtensionsPlugin
} from './plugins/addExtensionsPlugin'
import mpxResolveEntryPlugin from './plugins/mpxResolveEntryPlugin'
import parseRequest from './utils/parseRequest'
import { getDescriptor } from './utils/descriptorCache'
import { stringifyObject } from './utils/stringify'
import ensureArray from './utils/ensureArray'

function createMpxPlugin(
  options: ResolvedOptions,
  config?: UserConfig
): Plugin {
  const { include, exclude } = options
  const filter = createFilter(include, exclude)

  const mpxVuePlugin = createVuePlugin({
    include
  })

  return {
    name: 'vite:mpx',

    config() {
      return config
    },

    configureServer(server) {
      options.devServer = server
    },

    configResolved(config) {
      Object.assign(options, {
        ...options,
        root: config.root,
        sourceMap: config.command === 'build' ? !!config.build.sourcemap : true,
        isProduction: config.isProduction
      })
    },

    handleHotUpdate(ctx) {
      return handleHotUpdate(ctx, options)
    },

    async resolveId(id, ...args) {
      if (id === APP_HELPER_CODE) {
        return id
      }
      // return vue resolveId
      return mpxVuePlugin.resolveId?.call(this, id, ...args)
    },

    load(id) {
      if (id === APP_HELPER_CODE && mpxGlobal.entry) {
        const { filename } = parseRequest(mpxGlobal.entry)
        const descriptor = getDescriptor(filename)
        return descriptor && renderAppHelpCode(descriptor, options)
      }
      const { filename, query } = parseRequest(id)
      if (query.resolve !== undefined) {
        return renderPageRouteCode(filename)
      }
      if (query.mpx !== undefined) {
        const descriptor = getDescriptor(filename)
        if (descriptor) {
          let block
          if (query.type === 'template') {
            block = descriptor.template
          } else if (query.type === 'style') {
            block = descriptor.styles[Number(query.index)]
          }
          if (block) {
            return block.content
          }
        }
      }
      // return vue load
      return mpxVuePlugin.load?.call(this, id)
    },

    async transform(code, id) {
      const { filename, query } = parseRequest(id)
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
  const { mode, env, isProduction, defs, fileConditionRules } = resolvedOptions

  const plugins = [
    // mpx => vue
    createMpxPlugin(resolvedOptions, {
      optimizeDeps: {
        esbuildOptions: {
          plugins: [
            // prebuild for addExtensions
            esbuildCustomExtensionsPlugin({
              include: /@mpxjs/,
              extensions: [mode]
            })
          ]
        }
      }
    }),
    // add custom extensions
    customExtensionsPlugin({
      include: [...ensureArray(fileConditionRules), /@mpxjs/],
      extensions: [mode, env, env && `${mode}.${env}`].filter(Boolean)
    }),
    // ensure mpx entry point
    mpxResolveEntryPlugin(),
    // vue support for mpxjs/rumtime
    createVuePlugin(),
    replace({
      preventAssignment: true,
      values: stringifyObject({
        ...defs,
        'process.env.NODE_ENV': JSON.stringify(
          isProduction ? 'production' : 'development'
        )
      })
    }),
    nodePolyfills({
      include: [/@mpxjs/, /\.mpx/, /plugin-mpx:/, /polyfill-node/],
      exclude: [/polyfill-nodeglobal/] // ignore polyfill self
    })
  ]

  if (!isProduction) {
    plugins.push(
      commonjs({
        include: [/@mpxjs\/webpack-plugin\/lib\/utils\/env/]
      })
    )
  }

  return plugins
}
