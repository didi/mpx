import {
  type CallExpression,
  type ObjectExpression,
  type ExpressionNode,
} from '../ast'

export type PropsExpression =
  | ObjectExpression
  | CallExpression
  | ExpressionNode;
