class Interpreter {
  constructor (contextScope = []) {
    this.stateStack = []
    this.value = undefined
    contextScope.unshift(this.initGlobalContext())
    this.contextScope = contextScope

    this.TYPE_ERROR = 'TypeError'
    this.REFERENCE_ERROR = 'ReferenceError'
  }

  eval (ast) {
    const state = new State(ast, {})
    this.stateStack = [state]
    // eslint-disable-next-line
    while (this.step()) { }
    return this.value
  }

  step () {
    const state = this.stateStack[this.stateStack.length - 1]
    if (!state) {
      return false
    }
    const node = state.node
    const type = node[0]
    // Program
    if (type === 1 && state.done) {
      return false
    }

    let nextState
    try {
      nextState = this[type](this.stateStack, state, node)
    } catch (e) {
      throw Error(e)
    }

    if (nextState) {
      this.stateStack.push(nextState)
    }
    return true
  }

  getValue (ref) {
    if (ref[0] === Interpreter.SCOPE_REFERENCE) {
      // A null/varname variable lookup
      return this.getValueFromScope(ref[1])
    } else {
      // An obj/prop components tuple(foo.bar)
      return ref[0][ref[1]]
    }
  }

  setValue (ref, value) {
    if (ref[0] === Interpreter.SCOPE_REFERENCE) {
      return this.setValueToScope(ref[1], value)
    } else {
      ref[0][ref[1]] = value
      return value
    }
  }

  setValueToScope (name, value) {
    let index = this.contextScope.length
    while (index--) {
      const scope = this.contextScope[index]
      if (name in scope) {
        scope[name] = value
        return undefined
      }
    }
    this.throwException(this.REFERENCE_ERROR, name + ' is not defined')
  }

  getValueFromScope (name) {
    let index = this.contextScope.length
    while (index--) {
      const scope = this.contextScope[index]
      if (name in scope) {
        return scope[name]
      }
    }
    this.throwException(this.REFERENCE_ERROR, name + ' is not defined')
  }

  throwException (errorType, message) {
    throw new Error('[JsInterpreter]: ' + errorType + ` ${message}.`)
  }

  initGlobalContext () {
    const context = {
      // eslint-disable-next-line
      'undefined': undefined
    }
    return context
  }
}

Interpreter.SCOPE_REFERENCE = { SCOPE_REFERENCE: true }
Interpreter.STEP_ERROR = { STEP_ERROR: true }

class State {
  constructor (node, scope) {
    this.node = node
    this.scope = scope
  }
}

// Program
Interpreter.prototype[1] = function stepProgram (stack, state, node) {
  const bodyIndex = 1
  const expression = node[bodyIndex].shift()
  if (expression) {
    state.done = false
    return new State(expression)
  }
  state.done = true
}

// Identifier
Interpreter.prototype[2] = function stepIdentifier (stack, state, node) {
  const identifierIndex = 1
  stack.pop()
  // 引用场景: ++a
  if (state.components) {
    stack[stack.length - 1].value = [Interpreter.SCOPE_REFERENCE, node[identifierIndex]]
    return
  }
  const value = this.getValueFromScope(node[identifierIndex])
  stack[stack.length - 1].value = value
}

// Literal 暂未支持正则字面量，也不需要支持
Interpreter.prototype[3] = function stepLiteral (stack, state, node) {
  stack.pop()
  stack[stack.length - 1].value = node[1]
}

// ArrayExpression
Interpreter.prototype[28] = function stepArrayExpression (stack, state, node) {
  const elementsIndex = 1
  const elements = node[elementsIndex]
  let n = state.n_ || 0
  if (!state.array_) {
    state.array_ = []
  } else {
    state.array_[n] = state.value
    n++
  }
  while (n < elements.length) {
    if (elements[n]) {
      state.n_ = n
      return new State(elements[n])
    }
    n++
  }
  stack.pop()
  stack[stack.length - 1].value = state.array_
}

// ObjectExpression
Interpreter.prototype[29] = function stepObjectExpression (stack, state, node) {
  const propertyIndex = 1
  const kindIndex = 3
  let n = state.n_ || 0
  let property = node[propertyIndex][n]
  if (!state.object_) {
    // first execution
    state.object_ = {}
    state.properties_ = {}
  } else {
    const propName = state.destinationName
    if (!state.properties_[propName]) {
      state.properties_[propName] = {}
    }
    state.properties_[propName][property[kindIndex]] = state.value
    state.n_ = ++n
    property = node[propertyIndex][n]
  }

  if (property) {
    const keyIndex = 1
    const valueIndex = 2
    const key = property[keyIndex]
    const identifierOrLiteralValueIndex = 1
    let propName
    if (key[0] === 2 || key[0] === 3) {
      propName = key[identifierOrLiteralValueIndex]
    } else {
      throw SyntaxError('Unknown object structure: ' + key[0])
    }
    state.destinationName = propName
    return new State(property[valueIndex])
  }

  for (const key in state.properties_) {
    state.object_[key] = state.properties_[key].init
  }
  stack.pop()
  stack[stack.length - 1].value = state.object_
}

// UnaryExpression
Interpreter.prototype[33] = function stepUnaryExpression (stack, state, node) {
  const operatorIndex = 1
  const argumentIndex = 2
  if (!state.done_) {
    state.done_ = true
    const nextState = new State(node[argumentIndex])
    nextState.components = node[operatorIndex] === 'delete'
    return nextState
  }
  stack.pop()
  let value = state.value
  switch (node[operatorIndex]) {
    case '-':
      value = -value
      break
    case '+':
      value = +value
      break
    case '!':
      value = !value
      break
    case '~':
      value = ~value
      break
    case 'delete': {
      let result = true
      if (Array.isArray(value)) {
        let context = value[0]
        if (context === Interpreter.SCOPE_REFERENCE) {
          context = this.contextScope
        }
        const name = String(value[1])
        try {
          delete context[0][name]
        } catch (e) {
          this.throwException(this.TYPE_ERROR, "Cannot delete property '" + name + "' of '" + context[0] + "'")
          result = false
        }
      }
      value = result
      break
    }
    case 'typeof':
      value = typeof value
      break
    case 'void':
      value = undefined
      break
    default:
      throw SyntaxError('Unknow unary operator:' + node[operatorIndex])
  }
  stack[stack.length - 1].value = value
}

// UpdateExpression
Interpreter.prototype[34] = function stepUpdateExpression (stack, state, node) {
  const argumentIndex = 2
  if (!state.doneLeft_) {
    state.doneLeft_ = true
    const nextState = new State(node[argumentIndex])
    nextState.components = true
    return nextState
  }

  if (!state.leftSide_) {
    state.leftSide_ = state.value
  }
  if (!state.doneGetter_) {
    const leftValue = this.getValue(state.leftSide_)
    state.leftValue_ = leftValue
  }

  const operatorIndex = 1
  const leftValue = Number(state.leftValue_)
  let changeValue
  if (node[operatorIndex] === '++') {
    changeValue = leftValue + 1
  } else if (node[operatorIndex] === '--') {
    changeValue = leftValue - 1
  } else {
    throw SyntaxError('Unknown update expression: ' + node[operatorIndex])
  }
  const prefixIndex = 3
  const returnValue = node[prefixIndex] ? changeValue : leftValue
  this.setValue(state.leftSide_, changeValue)

  stack.pop()
  stack[stack.length - 1].value = returnValue
}

// BinaryExpression
Interpreter.prototype[35] = function stepBinaryExpression (stack, state, node) {
  if (!state.doneLeft_) {
    state.doneLeft_ = true
    const leftNodeIndex = 2
    return new State(node[leftNodeIndex])
  }
  if (!state.doneRight_) {
    state.doneRight_ = true
    state.leftValue_ = state.value
    const rightNodeIndex = 3
    return new State(node[rightNodeIndex])
  }
  stack.pop()
  const leftValue = state.leftValue_
  const rightValue = state.value
  const operatorIndex = 1
  let value
  switch (node[operatorIndex]) {
    // eslint-disable-next-line
    case '==': value = leftValue == rightValue; break
    // eslint-disable-next-line
    case '!=': value = leftValue != rightValue; break
    case '===': value = leftValue === rightValue; break
    case '!==': value = leftValue !== rightValue; break
    case '>': value = leftValue > rightValue; break
    case '>=': value = leftValue >= rightValue; break
    case '<': value = leftValue < rightValue; break
    case '<=': value = leftValue <= rightValue; break
    case '+': value = leftValue + rightValue; break
    case '-': value = leftValue - rightValue; break
    case '*': value = leftValue * rightValue; break
    case '/': value = leftValue / rightValue; break
    case '%': value = leftValue % rightValue; break
    case '&': value = leftValue & rightValue; break
    case '|': value = leftValue | rightValue; break
    case '^': value = leftValue ^ rightValue; break
    case '<<': value = leftValue << rightValue; break
    case '>>': value = leftValue >> rightValue; break
    case '>>>': value = leftValue >>> rightValue; break
    case 'in':
      if (!(rightValue instanceof Object)) {
        this.throwException(this.TYPE_ERROR, "'in' expects an object, not '" + rightValue + "'")
      }
      value = leftValue in rightValue
      break
    case 'instanceof':
      if (!(rightValue instanceof Object)) {
        this.throwException(this.TYPE_ERROR, 'Right-hand side of instanceof is not an object')
      }
      value = leftValue instanceof rightValue
      break
    default:
      throw SyntaxError('Unknown binary operator: ' + node[operatorIndex])
  }
  stack[stack.length - 1].value = value
}

// LogicalExpression
Interpreter.prototype[37] = function stepLogicalExpression (stack, state, node) {
  const operatorIndex = 1
  const leftIndex = 2
  const rightIndex = 3
  if (node[operatorIndex] !== '&&' && node[operatorIndex] !== '||') {
    throw SyntaxError('Unknown logical operator: ' + node[operatorIndex])
  }
  if (!state.doneLeft_) {
    state.doneLeft_ = true
    return new State(node[leftIndex])
  }

  if (!state.doneRight_) {
    state.doneRight_ = true
    // Shortcut evaluation
    if ((node[operatorIndex] === '&&' && !state.value) || (node[operatorIndex] === '||' && state.value)) {
      stack.pop()
      stack[stack.length - 1].value = state.value
    } else {
      state.doneRight_ = true
      return new State(node[rightIndex])
    }
  } else {
    stack.pop()
    stack[stack.length - 1].value = state.value
  }
}

// MemberExpression
Interpreter.prototype[38] = function stepMemberExperssion (stack, state, node) {
  const objectIndex = 1
  if (!state.doneObject_) {
    state.doneObject_ = true
    return new State(node[objectIndex])
  }

  const computedIndex = 3
  const propertyIndex = 2
  const propertyKeyIndex = 1
  let propName
  if (!node[computedIndex]) {
    state.object_ = state.value
    // obj.foo -- Just access `foo` directly.
    propName = node[propertyIndex][propertyKeyIndex]
  } else if (!state.doneProperty_) {
    state.object_ = state.value
    // obj[foo] -- Compute value of `foo`.
    state.doneProperty_ = true
    return new State(node[propertyIndex])
  } else {
    propName = state.value
  }
  // todo 取值的优化，错误提示等
  const value = state.object_[propName]
  stack.pop()
  stack[stack.length - 1].value = value
}

// ConditionalExpression
Interpreter.prototype[39] = function stepConditionalExpression (stack, state, node) {
  const testIndex = 1
  const mode = state.mode_ || 0
  if (mode === 0) {
    state.mode_ = 1
    return new State(node[testIndex])
  }
  if (mode === 1) {
    state.mode_ = 2
    const value = Boolean(state.value)
    const consequentIndex = 2
    const alternateIndex = 3
    if (value && node[consequentIndex]) {
      return new State(node[consequentIndex])
    } else if (!value && node[alternateIndex]) {
      return new State(node[alternateIndex])
    }
  }
  stack.pop()
  if (node[0] === 39) {
    stack[stack.length - 1].value = state.value
  }
}

// ExpressionStatement
Interpreter.prototype[40] = function stepExpressionStatement (stack, state, node) {
  const expressionIndex = 1
  if (!state.done_) {
    state.done_ = true
    return new State(node[expressionIndex])
  }
  stack.pop()
  // Save this value to interpreter.value for use as a return value
  this.value = state.value
}

export default Interpreter
