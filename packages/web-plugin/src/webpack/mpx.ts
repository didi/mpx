import pick from 'lodash/pick'
import { Options, optionKeys } from '../options'
import { MpxWithOptions } from '../mpx'

export * from '../mpx'

const mpx: MpxWithOptions = {} as MpxWithOptions

export function getOptions(): Options {
  return pick(mpx, optionKeys)
}

export default mpx
