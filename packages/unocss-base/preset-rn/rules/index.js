import { colorScheme } from './color'
import { backgroundStyles } from './background'
import { paddingAndMargins, spaces } from './spacing'
import typography from './typography'
import shadow from './shadow'
import behaviors from './behaviors'
import { overflows } from './layout'
import filters from './filters'
import staticRules from './static'
import {
  flexGridJustifiesAlignments,
  justifies,
  orders,
  placements,
  positions,
  floats,
  boxSizing
} from './positions'
import { flex } from './flex'
import { globalRules } from './global'
import { textAligns, verticalAligns } from './align'
import { container, containerParent } from './container'
import { animations } from './animation'
import { columns } from './columns'
import { divides } from './divide'
import { placeholders } from './placeholder'
import { scrolls } from './scrolls'
import { tables } from './table'
import { touchActions } from './touch-actions'
import { viewTransition } from './view-transition'
import { gaps } from './gap'
import { transitions } from './transition'
import { svgUtilities } from './svg'
import { rings } from './ring'
import border from './border'
import { transforms } from './transforms'
import { lineClamps } from './line-clamp'
import { grids } from './grid'
import textDecorations from './decoration'

export const blocklistRules = [
  ...textDecorations,
  ...backgroundStyles,
  ...border,
  ...overflows,
  // space
  ...paddingAndMargins,
  ...spaces,
  // position
  ...positions,
  ...flexGridJustifiesAlignments,
  ...justifies,
  ...orders,
  ...placements,
  ...floats,
  ...boxSizing,
  // static
  ...staticRules,
  ...verticalAligns,
  ...textAligns,
  ...flex,
  ...gaps,
  ...typography,
  ...behaviors,
  ...containerParent,
  ...container,
  ...colorScheme,
  ...columns,
  ...grids,
  ...placeholders,
  ...tables,
  ...scrolls,
  ...divides,
  ...touchActions,
  ...rings,
  ...lineClamps,
  ...svgUtilities,
  ...viewTransition,
  ...transitions,
  ...animations,
  ...filters,
  ...globalRules
]

export default [
  ...shadow,
  ...transforms
]
