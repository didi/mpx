export interface Query {
  vue?: null
  mpx?: null
  app?: null
  page?: null
  component?: null
  resolve?: null
  src?: string
  type?: 'script' | 'template' | 'style' | 'custom' | 'global' | 'main'
  index?: string
  lang?: string
  raw?: string
  componentId?: string
  async?: null
  root?: string
  [key: string]: unknown
}
