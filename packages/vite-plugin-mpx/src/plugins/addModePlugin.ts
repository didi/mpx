import path from 'path'
import fs from 'fs'
import { Plugin as EsbuildPlugin } from 'esbuild'
import { Plugin } from 'vite'
import { createFilter } from '@rollup/pluginutils'
import { Mode } from '../index'
export interface AddModeOptions {
  include: string | RegExp | (string | RegExp)[]
  exclude?: string | RegExp | (string | RegExp)[]
  mode: Mode
}

export interface EsbuildAddModeOptions {
  include: RegExp
  mode: Mode
}

/**
 * generate file path with mode
 * @param originPath - path/to/index.js
 * @param mode - mode
 * @returns path/to/index.mode.js
 */
function genModeFilePath(originPath: string, mode: Mode): string {
  const parseResult = path.parse(originPath)
  return path.format({
    ...parseResult,
    name: `${parseResult.name}.${mode}`,
    base: undefined
  })
}

export function esbuildAddModePlugin(
  options: EsbuildAddModeOptions
): EsbuildPlugin {
  return {
    name: 'esbuild:mpx-file-mode',
    setup(build) {
      build.onLoad({ filter: options.include }, async (args) => {
        try {
          const modeFilePath = genModeFilePath(args.path, options.mode)
          await fs.promises.access(modeFilePath)
          return {
            contents: await fs.promises.readFile(modeFilePath)
          }
        } catch {
          return
        }
      })
    }
  }
}

export default function addModePlugin(options: AddModeOptions): Plugin {
  const filter = createFilter(options.include, options.exclude)
  return {
    name: 'vite:mpx-file-mode',
    enforce: 'pre',
    async load(id) {
      if (!filter(id)) return
      try {
        const modeFilePath = genModeFilePath(id, options.mode)
        await fs.promises.access(modeFilePath)
        return {
          code: await fs.promises.readFile(modeFilePath, 'utf-8')
        }
      } catch {
        return null
      }
    }
  }
}
