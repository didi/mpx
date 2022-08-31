import qs from 'qs'

export interface Query {
  vue?: null
  mpx?: null
  app?: null
  page?: null
  component?: null
  resolve?: null
  src?: string
  type?: 'script' | 'template' | 'style' | 'custom'
  index?: string
  lang?: string
  raw?: string
  componentId?: string
  async?: null
  root?: string
  [key: string]: unknown
}

export default function parseRequest(id: string): {
  filename: string
  query: Query
} {
  const [filename, rawQuery] = id.split(`?`, 2)
  const query = qs.parse(rawQuery, { strictNullHandling: true }) as Query
  return {
    filename,
    query
  }
}
