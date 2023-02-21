import pick from 'lodash/pick'
import { Options, optionKeys } from '../options'

export type Mpx = {
  appInfo?: Record<string, string>
  pagesMap: any
  componentsMap: any
  usingComponents?: Record<string, string>
  currentPackageRoot?: string
  wxsContentMap?: any
  minimize?: boolean
  staticResourcesMap?: Record<string, any>
  vueContentCache?: Map<any, any>
  appTitle?: string
  recordResourceMap?(record: {
    resourcePath: string
    resourceType: 'page' | 'component'
    outputPath: string
    packageRoot: string
    recordOnly: boolean
    warn(e: Error): void
    error(e: Error): void
  }): void
}

export type MpxWithOptions = Mpx & Options

const mpx: MpxWithOptions = {} as MpxWithOptions

export function getOptions(): Options {
  return pick(mpx, optionKeys)
}

export default mpx
