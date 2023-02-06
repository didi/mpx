import { Mpx } from "src/mpx"

export interface ViteMpx extends Mpx {
  entry?: string
  pagesMap: Record<string, string>
  componentsMap: Record<string, string>
  pagesEntryMap: Record<string, string>
}

const mpx: ViteMpx = {
  entry: undefined,
  pagesMap: {},
  componentsMap: {},
  pagesEntryMap: {}
}

export default mpx
