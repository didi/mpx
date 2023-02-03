import { Options } from 'src/options'
import omit from 'lodash-es/omit'

const options = [
  'mode',
  'srcMode',
  'env',
  'externalClasses',
  'projectRoot',
  'autoScopeRules',
  'transRpxRules',
  'postcssInlineConfig',
  'decodeHTMLText',
  'webConfig',
  'defs',
  'i18n',
  'checkUsingComponents',
  'checkUsingComponentsRules',
  'externals',
  'pathHashMode',
  'customOutputPath'
] as const

type ArrToInterSection<T extends readonly string[]> = T extends readonly [
  infer A,
  ...infer B
]
  ? A | ArrToInterSection<string[] & B>
  : never

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
} & Pick<Options, ArrToInterSection<typeof options>> & {
    [k: string]: any
  }

export function getOptions(mpx: Mpx): Omit<Mpx, ArrToInterSection<typeof options>> {
  return omit(mpx, options)
}
