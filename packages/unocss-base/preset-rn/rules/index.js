import { colorScheme } from './color.js'
import { backgroundStyles } from './background.js'
import { paddingAndMargins, spaces } from './spacing.js'
import typography from './typography.js'
import shadow from './shadow.js'
import behaviors from './behaviors.js'
import { overflows } from './layout.js'
import filters from './filters.js'
import staticRules from './static.js'
import {
  flexGridJustifiesAlignments,
  justifies,
  orders,
  placements,
  positions,
  floats,
  boxSizing
} from './positions.js'
import { flex } from './flex.js'
import { globalRules } from './global.js'
import { textAligns, verticalAligns } from './align.js'
import { container, containerParent } from './container.js'
import { animations } from './animation.js'
import { columns } from './columns.js'
import { divides } from './divide.js'
import { placeholders } from './placeholder.js'
import { scrolls } from './scrolls.js'
import { tables } from './table.js'
import { touchActions } from './touch-actions.js'
import { viewTransition } from './view-transition.js'
import { gaps } from './gap.js'
import { transitions } from './transition.js'
import { svgUtilities } from './svg.js'
import { rings } from './ring.js'
import border from './border.js'
import { transforms } from './transforms.js'
import { textDecorations } from './decoration.js'
import { lineClamps } from './line-clamp.js'
import { grids } from './grid.js'

export const blocklistRules = [
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
  ...textDecorations,
  ...shadow,
  ...transforms
]
