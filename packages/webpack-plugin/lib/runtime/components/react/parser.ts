interface Token {
  type: string
  value: string | number
}

interface ExpressionNode {
  type: 'NUMBER'
  value: number
}

export class ExpressionParser {
  private tokens: Token[]
  private formatter: (val: string) => number
  private functions: { [key: string]: (...args: number[]) => number }
  private current: number

  constructor (input: string, formatter: (val: string) => number = val => parseFloat(val), functions: { [key: string]: (...args: number[]) => number } = {}) {
    this.tokens = this.tokenize(input)
    this.formatter = formatter
    this.functions = functions
    this.current = 0
  }

  tokenize (input: string): Token[] {
    const tokens: Token[] = []
    const regex = /(\d+\.?\d*(?:px|rpx|%|vw|vh)?|[+\-*/(),]|\b[a-zA-Z_][a-zA-Z0-9_]*\b)/g
    let match: RegExpExecArray | null
    while ((match = regex.exec(input))) {
      if (/^\d+\.?\d*(?:px|rpx|%|vw|vh)?$/.test(match[0])) {
        const lastToken = tokens[tokens.length - 1]
        const last2Token = tokens[tokens.length - 2]
        if (lastToken?.type === '-' && (!last2Token || /^[+\-*/(,]$/.test(last2Token?.type))) {
          tokens.pop()
          tokens.push({
            type: 'NUMBER',
            value: '-' + match[0]
          })
        } else {
          tokens.push({
            type: 'NUMBER',
            value: match[0]
          })
        }
      } else {
        tokens.push({
          type: match[0],
          value: match[0]
        })
      }
    }
    return tokens
  }

  parse (): ExpressionNode {
    return this.expression()
  }

  private expression (): ExpressionNode {
    let node = this.term()
    while (this.current < this.tokens.length &&
      (this.tokens[this.current].type === '+' || this.tokens[this.current].type === '-')) {
      const operator = this.tokens[this.current].type
      this.current++
      const right = this.term()
      node = this.applyOperator(operator, node, right)
    }
    return node
  }

  private term (): ExpressionNode {
    let node = this.factor()
    while (this.current < this.tokens.length &&
      (this.tokens[this.current].type === '*' || this.tokens[this.current].type === '/')) {
      const operator = this.tokens[this.current].type
      this.current++
      const right = this.factor()
      node = this.applyOperator(operator, node, right)
    }
    return node
  }

  private factor (): ExpressionNode {
    const token = this.tokens[this.current]
    if (token.type === 'NUMBER') {
      this.current++
      const numericValue = this.formatter(token.value as string)
      return { type: 'NUMBER', value: numericValue }
    } else if (token.type === '(') {
      this.current++
      const node = this.expression()
      if (this.tokens[this.current].type !== ')') {
        throw new Error('Expected closing parenthesis')
      }
      this.current++
      return node
    } else if (this.functions[token.type]) {
      this.current++
      if (this.tokens[this.current].type !== '(') {
        throw new Error('Expected opening parenthesis after function')
      }
      this.current++
      const args = this.parseArguments()
      if (this.tokens[this.current].type !== ')') {
        throw new Error('Expected closing parenthesis')
      }
      this.current++
      return this.applyFunction(token.type, args)
    }
    throw new Error(`Unexpected token: ${token.type}`)
  }

  private parseArguments (): ExpressionNode[] {
    const args: ExpressionNode[] = []
    while (this.current < this.tokens.length && this.tokens[this.current].type !== ')') {
      args.push(this.expression())
      if (this.tokens[this.current].type === ',') {
        this.current++
      }
    }
    return args
  }

  private applyOperator (operator: string, left: ExpressionNode, right: ExpressionNode): ExpressionNode {
    const leftVal = left.value
    const rightVal = right.value
    let result: number
    switch (operator) {
      case '+': result = leftVal + rightVal; break
      case '-': result = leftVal - rightVal; break
      case '*': result = leftVal * rightVal; break
      case '/': result = leftVal / rightVal; break
      default: throw new Error(`Unknown operator: ${operator}`)
    }
    return { type: 'NUMBER', value: result }
  }

  private applyFunction (func: string, args: ExpressionNode[]): ExpressionNode {
    if (args.some(arg => arg.type !== 'NUMBER')) {
      throw new Error('Function arguments must be numbers')
    }
    const numericArgs = args.map(arg => arg.value)
    if (this.functions[func]) {
      return { type: 'NUMBER', value: this.functions[func].apply(null, numericArgs) }
    } else {
      throw new Error(`Unknown function: ${func}`)
    }
  }
}

interface FuncInfo {
  start: number
  end: number
  args: string[]
}

export function parseFunc (str: string, funcName: string): FuncInfo[] {
  const regex = new RegExp(`${funcName}\\(`, 'g')
  const result: FuncInfo[] = []
  let match: RegExpExecArray | null

  while ((match = regex.exec(str)) !== null) {
    const start = match.index
    let i = start + funcName.length + 1
    let depth = 1
    const args: string[] = []
    let arg = ''

    while (depth && i < str.length) {
      if (depth === 1 && (str[i] === ',' || str[i] === ')')) {
        args.push(arg.trim())
        arg = ''
      } else {
        arg += str[i]
      }
      switch (str[i]) {
        case '(':
          depth++
          break
        case ')':
          depth--
          break
        default:
        // Do nothing
      }
      i++
    }

    const end = regex.lastIndex = i
    result.push({
      start,
      end,
      args
    })
  }

  return result
}

interface Replacement {
  start: number
  end: number
  content: string
}

export class ReplaceSource {
  private _source: string
  private _replacements: Replacement[]

  constructor (source: string) {
    this._source = source
    this._replacements = []
  }

  replace (start: number, end: number, content: string): void {
    this._replacements.push({ start, end, content })
  }

  source (): string {
    if (this._replacements.length === 0) {
      return this._source
    }
    let current = this._source
    let pos = 0
    const result: string[] = []

    for (const replacement of this._replacements) {
      const start = Math.floor(replacement.start)
      const end = Math.floor(replacement.end) + 1
      if (pos < start) {
        const offset = start - pos
        result.push(current.slice(0, offset))
        current = current.slice(offset)
        pos = start
      }
      result.push(replacement.content)
      if (pos < end) {
        const offset = end - pos
        current = current.slice(offset)
        pos = end
      }
    }
    result.push(current)
    return result.join('')
  }
}
