import { colorScheme } from './color.js'
import { backgroundStyles } from './background.js'
import { margins, paddings, spaces } from './spacing.js'
import typography from './typography.js'
import shadow from './shadow.js'
import behaviors from './behaviors.js'
import { overflows } from './layout.js'
import filters from './filters.js'
import {
  appearances,
  backgroundBlendModes,
  contains,
  cursors,
  displays,
  resizes,
  whitespaces,
  contentVisibility,
  contents,
  breaks,
  textWraps,
  textOverflows,
  fontStyles,
  fontSmoothings,
  hyphens
} from './static.js'
import {
  flexGridJustifiesAlignments,
  justifies,
  orders,
  placements,
  positions,
  insets,
  floats,
  boxSizing
} from './positions.js'
import { flex } from './flex.js'
import { globalRules } from './global.js'
import { textAligns, verticalAligns } from './align.js'
import { containerParent } from './container.js'
import { animations } from './animation.js'
import { columns } from './columns.js'
import { divide } from './divide.js'
import { placeholders } from './placeholder.js'
import { scrolls } from './scrolls.js'
import { tables } from './table.js'
import { touchActions } from './touch-actions.js'
import { viewTransition } from './view-transition.js'

export default [
  ...typography,
  ...shadow,
  ...behaviors,
  ...filters,
  // align
  ...verticalAligns,
  ...textAligns,
  // color
  ...colorScheme,
  ...backgroundStyles,
  // container
  ...containerParent,
  // layout
  ...overflows,
  // positions
  ...floats,
  ...flex,
  ...positions,
  ...justifies,
  ...orders,
  ...placements,
  ...insets,
  ...flexGridJustifiesAlignments,
  ...boxSizing,
  // static
  ...displays,
  ...backgroundBlendModes,
  ...appearances,
  ...cursors,
  ...contains,
  ...resizes,
  ...whitespaces,
  ...contentVisibility,
  ...contents,
  ...breaks,
  ...textWraps,
  ...textOverflows,
  ...fontStyles,
  ...fontSmoothings,
  ...hyphens,
  // spaceing
  ...paddings,
  ...margins,
  ...spaces,
  // animations,
  ...animations,
  // columns
  ...columns,
  // divide
  ...divide,
  // placeholder
  ...placeholders,
  // scrolls
  ...scrolls,
  // tables
  ...tables,
  // touchActions
  ...touchActions,
  // view-transition
  ...viewTransition,
  // global
  ...globalRules
]
