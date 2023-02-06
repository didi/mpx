import pick from 'lodash-es/pick'
import { Options, optionKeys } from 'src/options'
import { MpxWithOptions } from '../mpx'

export * from 'src/mpx'

const mpx: MpxWithOptions = {} as MpxWithOptions

export function getOptions(): Options {
  return pick(mpx, optionKeys)
}

export default mpx
