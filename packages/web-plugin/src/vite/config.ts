export type ResolvedConfig = {
  sourceMap?: boolean
  isProduction: boolean
  base?: string
}

export const resolvedConfig: ResolvedConfig = {
  isProduction: true
}
