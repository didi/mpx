import shadow from './shadow'
import { transforms } from './transforms'
// block rules
import { blockColorScheme } from './color'
import { blockBackgroundStyles } from './background'
import { blockPaddingAndMargins, blockSpaces } from './spacing'
import { blockTypography } from './typography'
import { blockBehaviors } from './behaviors'
import { blockOverflows } from './layout'
import { blockFilters } from './filters'
import { blockStatics } from './static'
import {
  blockFlexGridJustifiesAlignments,
  blockJustifies,
  blockOrders,
  blockPlacements,
  blockPositions,
  blockFloats,
  blockBoxSizing
} from './positions'
import { blockFlex } from './flex'
import { blockGlobalRules } from './global'
import { blockTextAligns, blockVerticalAligns } from './align'
import { blockContainer, blockContainerParent } from './container'
import { blockAnimations } from './animation'
import { blockColumns } from './columns'
import { blockDivides } from './divide'
import { blockPlaceholders } from './placeholder'
import { blockScrolls } from './scrolls'
import { blockTables } from './table'
import { blockTouchActions } from './touch-actions'
import { blockViewTransition } from './view-transition'
import { blockGaps } from './gap'
import { blockTransitions } from './transition'
import { blockSvgUtilities } from './svg'
import { blockRings } from './ring'
import { blockBorders } from './border'
import { blockLineClamps } from './line-clamp'
import { blockGrids } from './grid'
import { blockTextDecorations } from './decoration'

export const blocklistRules = [
  ...blockTextDecorations,
  ...blockBackgroundStyles,
  ...blockBorders,
  ...blockOverflows,
  // space
  ...blockPaddingAndMargins,
  ...blockSpaces,
  // position
  ...blockPositions,
  ...blockFlexGridJustifiesAlignments,
  ...blockJustifies,
  ...blockOrders,
  ...blockPlacements,
  ...blockFloats,
  ...blockBoxSizing,
  // static
  ...blockStatics,
  ...blockVerticalAligns,
  ...blockTextAligns,
  ...blockFlex,
  ...blockGaps,
  ...blockTypography,
  ...blockBehaviors,
  ...blockContainerParent,
  ...blockContainer,
  ...blockColorScheme,
  ...blockColumns,
  ...blockGrids,
  ...blockPlaceholders,
  ...blockTables,
  ...blockScrolls,
  ...blockDivides,
  ...blockTouchActions,
  ...blockRings,
  ...blockLineClamps,
  ...blockSvgUtilities,
  ...blockViewTransition,
  ...blockTransitions,
  ...blockAnimations,
  ...blockFilters,
  ...blockGlobalRules
]

export default [...shadow, ...transforms]
