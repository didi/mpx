import { displays } from './layout/display.js'
import { flex } from './layout/flex.js'
import { floats } from './layout/floats.js'
import { overflows } from './layout/overflows.js'
import { positions } from './layout/positions.js'

export default [
  ...overflows,
  ...floats,
  ...displays,
  ...flex,
  ...positions
]
