const acorn = require('acorn')

const walk = require('acorn-walk')

module.exports = parseAsset

/**
 * @typedef {import("acorn").Program} Program
 * @typedef {import("acorn").Node} Node
 * @typedef {import("acorn")} Acorn
 * @typedef {{ start: number, end: number }} Location
 * @typedef {{ locations: Record<string, Location>, ast: Program }} ParseAssetResult
 */

/**
 *
 * @param {string} content
 * @param {Program | undefined} ast
 * @returns {ParseAssetResult}
 */
function parseAsset (content, ast) {
  if (!ast) {
    ast = acorn.parse(content, {
      sourceType: 'script',
      locations: true,
      // I believe in a bright future of ECMAScript!
      // Actually, it's set to `2050` to support the latest ECMAScript version that currently exists.
      // Seems like `acorn` supports such weird option value.
      ecmaVersion: 2050
    })
  }
  /**
   * @type {{ locations: ParseAssetResult['locations'] | null, expressionStatementDepth: number }}
   */
  const walkState = {
    locations: null,
    expressionStatementDepth: 0
  }
  walk.recursive(ast, walkState, {
    ExpressionStatement (node, state, c) {
      if (state.locations) return
      state.expressionStatementDepth++

      if ( // Webpack 5 stores modules in the the top-level IIFE
        state.expressionStatementDepth === 1 && ast.body.includes(node) && isIIFE(node.expression)) {
        const fn = getIIFECallExpression(node.expression)

        if ( // It should not contain neither arguments
          fn.arguments.length === 0 && // ...nor parameters
          fn.callee.params.length === 0) {
          // Modules are stored in the very first variable declaration as hash
          const firstVariableDeclaration = fn.callee.body.body.find(node => node.type === 'VariableDeclaration')

          if (firstVariableDeclaration) {
            for (const declaration of firstVariableDeclaration.declarations) {
              if (declaration.init) {
                state.locations = getModulesLocations(declaration.init)

                if (state.locations) {
                  break
                }
              }
            }
          }
        }
      }

      if (!state.locations) {
        c(node.expression, state)
      }

      state.expressionStatementDepth--
    },

    AssignmentExpression (node, state) {
      if (state.locations) return // Modules are stored in exports.modules:
      // exports.modules = {};

      const {
        left,
        right
      } = node

      if (left && left.object && left.object.name === 'exports' && left.property && left.property.name === 'modules' && isModulesHash(right)) {
        state.locations = getModulesLocations(right)
      }
    },

    CallExpression (node, state, c) {
      if (state.locations) return
      const args = node.arguments // Main chunk with webpack loader.
      // Modules are stored in first argument:
      // (function (...) {...})(<modules>)

      if (node.callee.type === 'FunctionExpression' && !node.callee.id && args.length === 1 && isSimpleModulesList(args[0])) {
        state.locations = getModulesLocations(args[0])
        return
      } // Async Webpack < v4 chunk without webpack loader.
      // webpackJsonp([<chunks>], <modules>, ...)
      // As function name may be changed with `output.jsonpFunction` option we can't rely on it's default name.

      if (node.callee.type === 'Identifier' && mayBeAsyncChunkArguments(args) && isModulesList(args[1])) {
        state.locations = getModulesLocations(args[1])
        return
      } // Async Webpack v4 chunk without webpack loader.
      // (window.webpackJsonp=window.webpackJsonp||[]).push([[<chunks>], <modules>, ...]);
      // As function name may be changed with `output.jsonpFunction` option we can't rely on it's default name.

      if (isAsyncChunkPushExpression(node)) {
        state.locations = getModulesLocations(args[0].elements[1])
        return
      } // Webpack v4 WebWorkerChunkTemplatePlugin
      // globalObject.chunkCallbackName([<chunks>],<modules>, ...);
      // Both globalObject and chunkCallbackName can be changed through the config, so we can't check them.

      if (isAsyncWebWorkerChunkExpression(node)) {
        state.locations = getModulesLocations(args[1])
        return
      } // Walking into arguments because some of plugins (e.g. `DedupePlugin`) or some Webpack
      // features (e.g. `umd` library output) can wrap modules list into additional IIFE.

      args.forEach(arg => c(arg, state))
    }

  })
  // let modules
  //
  // if (walkState.locations) {
  //   modules = _.mapValues(walkState.locations, loc => content.slice(loc.start, loc.end))
  // } else {
  //   modules = {}
  // }

  return {
    locations: walkState.locations || {},
    ast
  }
}

/**
 *
 * @param {Node} node
 * @returns {boolean}
 */
function isIIFE (node) {
  // mpx fix
  if (node.type === 'SequenceExpression') {
    return isIIFE(node.expressions[0])
  }
  /* eslint-disable no-mixed-operators */
  return node.type === 'CallExpression' || node.type === 'UnaryExpression' && node.argument.type === 'CallExpression'
}

/**
 *
 * @param {Node} node
 * @returns {import('acorn').UnaryExpression['argument'] | Node}
 */
function getIIFECallExpression (node) {
  // mpx fix
  if (node.type === 'SequenceExpression') {
    return getIIFECallExpression(node.expressions[0])
  }
  if (node.type === 'UnaryExpression') {
    return node.argument
  } else {
    return node
  }
}

/**
 *
 * @param {Node} node
 * @returns {boolean}
 */
function isModulesList (node) {
  return isSimpleModulesList(node) || // Modules are contained in expression `Array([minimum ID]).concat([<module>, <module>, ...])`
    isOptimizedModulesArray(node)
}

/**
 *
 * @param {Node} node
 * @returns {boolean}
 */
function isSimpleModulesList (node) {
  return (// Modules are contained in hash. Keys are module ids.
    isModulesHash(node) || // Modules are contained in array. Indexes are module ids.
    isModulesArray(node)
  )
}

/**
 *
 * @param {Node} node
 * @returns {boolean}
 */
function isModulesHash (node) {
  return node.type === 'ObjectExpression' && node.properties.map(node => node.value).every(isModuleWrapper)
}

/**
 *
 * @param {Node} node
 * @returns {boolean}
 */
function isModulesArray (node) {
  return node.type === 'ArrayExpression' && node.elements.every(elem => // Some of array items may be skipped because there is no module with such id
    !elem || isModuleWrapper(elem))
}

/**
 *
 * @param {Node} node
 * @returns {boolean}
 */
function isOptimizedModulesArray (node) {
  // Checking whether modules are contained in `Array(<minimum ID>).concat(...modules)` array:
  // https://github.com/webpack/webpack/blob/v1.14.0/lib/Template.js#L91
  // The `<minimum ID>` + array indexes are module ids
  return node.type === 'CallExpression' && node.callee.type === 'MemberExpression' && // Make sure the object called is `Array(<some number>)`
    node.callee.object.type === 'CallExpression' && node.callee.object.callee.type === 'Identifier' && node.callee.object.callee.name === 'Array' && node.callee.object.arguments.length === 1 && isNumericId(node.callee.object.arguments[0]) && // Make sure the property X called for `Array(<some number>).X` is `concat`
    node.callee.property.type === 'Identifier' && node.callee.property.name === 'concat' && // Make sure exactly one array is passed in to `concat`
    node.arguments.length === 1 && isModulesArray(node.arguments[0])
}

/**
 *
 * @param {Node} node
 * @returns {boolean}
 */
function isModuleWrapper (node) {
  /* eslint-disable no-mixed-operators */
  return (// It's an anonymous function expression that wraps module
    (node.type === 'FunctionExpression' || node.type === 'ArrowFunctionExpression') && !node.id || // If `DedupePlugin` is used it can be an ID of duplicated module...
    isModuleId(node) || // or an array of shape [<module_id>, ...args]
    node.type === 'ArrayExpression' && node.elements.length > 1 && isModuleId(node.elements[0])
  )
}

/**
 *
 * @param {Node} node
 * @returns {boolean}
 */
function isModuleId (node) {
  return node.type === 'Literal' && (isNumericId(node) || typeof node.value === 'string')
}

/**
 *
 * @param {Node} node
 * @returns {boolean}
 */
function isNumericId (node) {
  return node.type === 'Literal' && Number.isInteger(node.value) && node.value >= 0
}

/**
 *
 * @param {Node} node
 * @returns {boolean}
 */
function isChunkIds (node) {
  // Array of numeric or string ids. Chunk IDs are strings when NamedChunksPlugin is used
  return node.type === 'ArrayExpression' && node.elements.every(isModuleId)
}

/**
 *
 * ```unknown
 * (window.webpackJsonp = window.webpackJsonp||[]).push([[<chunks>], <modules>, ...])
 *                                                 ^^^^
 * ```
 *
 * ```unknown
 * var a = 'push';
 * (window.webpackJsonp = window.webpackJsonp||[])[a]([[<chunks>], <modules>, ...])
 *                                                ^^^
 * ```
 *
 * @param {Node} node
 * @returns {boolean}
 */
function isAsyncChunkPushExpression (node) {
  const {
    callee,
    arguments: args
  } = node
  return callee.type === 'MemberExpression' && callee.object.type === 'AssignmentExpression' && args.length === 1 && args[0].type === 'ArrayExpression' && mayBeAsyncChunkArguments(args[0].elements) && isModulesList(args[0].elements[1])
}

/**
 *
 * @param {Node} node
 * @returns {boolean}
 */
function mayBeAsyncChunkArguments (args) {
  return args.length >= 2 && isChunkIds(args[0])
}

/**
 *
 * @param {Node} node
 * @returns {boolean}
 */
function isAsyncWebWorkerChunkExpression (node) {
  const {
    callee,
    type,
    arguments: args
  } = node
  return type === 'CallExpression' && callee.type === 'MemberExpression' && args.length === 2 && isChunkIds(args[0]) && isModulesList(args[1])
}

/**
 *
 * @param {Node} node
 * @returns {Record<string, Location>}
 */
function getModulesLocations (node) {
  if (node.type === 'ObjectExpression') {
    // Modules hash
    /** @type {import('acorn').ObjectExpression['properties']} */
    const modulesNodes = node.properties
    return modulesNodes.reduce((result, moduleNode) => {
      const moduleId = moduleNode.key.name || moduleNode.key.value
      result[moduleId] = getModuleLocation(moduleNode.value)
      return result
    }, {})
  }

  const isOptimizedArray = node.type === 'CallExpression'

  if (node.type === 'ArrayExpression' || isOptimizedArray) {
    // Modules array or optimized array
    const minId = isOptimizedArray // Get the [minId] value from the Array() call first argument literal value
      ? node.callee.object.arguments[0].value // `0` for simple array
      : 0
    const modulesNodes = isOptimizedArray // The modules reside in the `concat()` function call arguments
      ? node.arguments[0].elements
      : node.elements
    return modulesNodes.reduce((result, moduleNode, i) => {
      if (moduleNode) {
        result[i + minId] = getModuleLocation(moduleNode)
      }

      return result
    }, {})
  }

  return {}
}

/**
 * @param {Node} node
 * @returns {Location}
 */
function getModuleLocation (node) {
  return {
    start: node.start,
    end: node.end
  }
}
