export interface Mpx {
  entry?: string
  pagesMap: Record<string, unknown>
  componentsMap: Record<string, unknown>
  pagesEntryMap: Record<string, unknown>
}

const mpx: Mpx = {
  entry: '',
  pagesMap: {},
  componentsMap: {},
  pagesEntryMap: {}
}

export default mpx
