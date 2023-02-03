import { Options } from '../options'

export { Options }

export type ResolvedOptions = Options & {
  sourceMap?: boolean
  isProduction: boolean
  base?: string
}

export { processOptions } from '../options'
