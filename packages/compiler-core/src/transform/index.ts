import { type ExpressionNode } from '../ast'

export interface ImportItem {
  exp: string | ExpressionNode
  path: string
}

// export interface TransformContext {
//   /** */
// }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type TransformContext = any
