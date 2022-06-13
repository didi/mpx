const babylon = require('@babel/parser')
var MagicString = require('magic-string')

// Special compiler macros
const DEFINE_PROPS = 'defineProps'
const DEFINE_OPTIONS = 'defineOptions'
const USE_CONTEXT = 'useContext'

const MPX_CORE = '@mpxjs/core'

const BindingTypes = {
  /**
   * returned from data()
   */
  DATA: 'data',
  /**
   * declared as a prop
   */
  PROPS: 'props',
  /**
   * a local alias of a `<script setup>` destructured prop.
   * the original is stored in __propsAliases of the bindingMetadata object.
   */
  PROPS_ALIASED: 'props-aliased',
  /**
   * a let binding (may or may not be a ref)
   */
  SETUP_LET: 'setup-let',
  /**
   * a const binding that can never be a ref.
   * these bindings don't need `unref()` calls when processed in inlined
   * template expressions.
   */
  SETUP_CONST: 'setup-const',
  /**
   * a const binding that does not need `unref()`, but may be mutated.
   */
  SETUP_REACTIVE_CONST: 'setup-reactive-const',
  /**
   * a const binding that may be a ref.
   */
  SETUP_MAYBE_REF: 'setup-maybe-ref',
  /**
   * bindings that are guaranteed to be refs
   */
  SETUP_REF: 'setup-ref',
  /**
   * declared by other options, e.g. computed, inject
   */
  OPTIONS: 'options'
}

function isCallOf(
    node,
    test
) {
  return !!(
      node &&
      node.type === 'CallExpression' &&
      node.callee.type === 'Identifier' &&
      (typeof test === 'string'
          ? node.callee.name === test
          : test(node.callee.name))
  )
}

// TODO add 注释
function canNeverBeRef(node, userReactiveImport) {
  if (isCallOf(node, userReactiveImport)) {
    return true
  }
  switch (node.type) {
    case 'UnaryExpression':
    case 'BinaryExpression':
    case 'ArrayExpression':
    case 'ObjectExpression':
    case 'FunctionExpression':
    case 'ArrowFunctionExpression':
    case 'UpdateExpression':
    case 'ClassExpression':
    case 'TaggedTemplateExpression':
      return true
    case 'SequenceExpression':
      return canNeverBeRef(
          node.expressions[node.expressions.length - 1],
          userReactiveImport
      )
    default:
      if (node.type.endsWith('Literal')) {
        return true
      }
      return false
  }
}

function isCompilerMacro(c) {
  return c === DEFINE_PROPS || c === DEFINE_OPTIONS || c === USE_CONTEXT
}

function registerBinding(bindings, node, type) {
  bindings[node.name] = type
}

function walkDeclaration(node, bindings, userImportAlias) {
  if (node.type === 'VariableDeclaration') {
    const isConst = node.kind === 'const'
    for (const { id, init } of node.declarations) {
      const isDefineCall = !!(
          isConst &&
          isCallOf(
              init,
              isCompilerMacro
          )
      )
      if (id.type === 'Identifier') {
        let bindingType
        const userReactiveBinding = userImportAlias['reactive'] || 'reactive'
        // 是否是 reactive init
        if (isCallOf(init, userReactiveBinding)) {
          bindingType = isConst
              ? BindingTypes.SETUP_REACTIVE_CONST
              : BindingTypes.SETUP_LET
        } else if(
            isDefineCall ||
            (isConst && canNeverBeRef(init, userReactiveBinding))
        ) {
          bindingType = isCallOf(init, DEFINE_PROPS)
              ? BindingTypes.SETUP_REACTIVE_CONST
              : BindingTypes.SETUP_CONST
        } else if (isConst) {
          if (isCallOf(init, userImportAlias['ref'] || 'ref')) {
            bindingType = BindingTypes.SETUP_REF
          } else {
            bindingType = BindingTypes.SETUP_MAYBE_REF
          }
        } else {
          bindingType = BindingTypes.SETUP_LET
        }
        registerBinding(bindings, id, bindingType)
      } else {
        if (isCallOf(init, DEFINE_PROPS)) {
          // skip walking props destructure
          return
        }
        if (id.type === 'ObjectPattern') {
          walkObjectPattern(id, bindings, isConst, isDefineCall)
        } else if (id.type === 'ArrayPattern') {
          walkArrayPattern(id, bindings, isConst, isDefineCall)
        }
      }
    }
  } else if (
      node.type === 'TSEnumDeclaration' ||
      node.type === 'FunctionDeclaration' ||
      node.type === 'ClassDeclaration'
  ) {
    bindings[node.id.name] = BindingTypes.SETUP_CONST
  }

}

function walkObjectPattern(node, bindings, isConst, isDefineCall = false) {
  for (const p of node.properties) {
    if (p.type === 'ObjectProperty') {
      if (p.key.type === 'Identifier' && p.key === p.value) {
        // shorthand: const { x } = ...
        const type = isDefineCall ? BindingTypes.SETUP_CONST : isConst ? BindingTypes.SETUP_MAYBE_REF : BindingTypes.SETUP_LET
        registerBinding(bindings, p.key, type)
      } else {
        // TODO
        //walkPattern(p.value, bindings, isConst, isDefineCall)
      }
    }
  }
}

function walkArrayPattern(
    node,
    bindings,
    isConst,
    isDefineCall = false
) {
  for (const e of node.elements) {
    // TODO
    // e && walkPattern(e, bindings, isConst, isDefineCall)
  }
}

function compileScriptSetup(content, options) {
  const _s = new MagicString(content)
  const scriptBindings = Object.create(null)
  const setupBindings = Object.create(null)
  const userImportAlias = Object.create(null)
  const userImports = Object.create(null)

  let startOffset = 0
  let endOffset = 0
  let hasAwait = false
  let hasDefinePropsCall = false

  let propsRuntimeDecl
  let propsTypeDeclRaw
  let propsTypeDecl

  function registerUserImport(
      source,
      local,
      imported = false,
      isType,
      isFromSetup = true,
      needTemplateUsageCheck
  ) {
    if (source === MPX_CORE && imported) {
      userImportAlias[imported] = local
    }

    userImports[local] = {
      isType,
      imported: imported || 'default',
      source,
      isFromSetup
    }
  }

  function processDefineProps (node) {
    if (!isCallOf(node, DEFINE_PROPS)) {
      return false
    }
    if (hasDefinePropsCall) {
      console.error(`duplicate ${DEFINE_PROPS}() call`, node)
    }
    hasDefinePropsCall = true
    propsRuntimeDecl = node.arguments[0]

    /**
     * defineProps<{
     *   foo: string
     *   bar?: number
     * }>()
     */
    if (node.typeParameters) {
      if (propsRuntimeDecl) {
        console.error(
            `${DEFINE_PROPS}() cannot accept both type and non-type arguments ` +
            `at the same time. Use one or the other.`,
            node
        )
      }

      propsTypeDeclRaw = node.typeParameters.params[0]

      propsTypeDecl = resolveQualifiedType(
          propsTypeDeclRaw,
          node => node.type === 'TSFunctionType' || node.type === 'TSTypeLiteral'
      )

      if (!propsTypeDecl) {
        console.error(
            `type argument passed to ${DEFINE_PROPS}() must be a literal type, ` +
            `or a reference to an interface or literal type.`,
            propsTypeDeclRaw
        )
      }
    }

    return true
  }

  function resolveQualifiedType(node, qualifier) {
    // TODO
  }

  const scriptSetupAst = babylon.parse(content, {
    plugins: [
      'topLevelAwait'
    ],
    sourceType: 'module'
  })
  for (const node of scriptSetupAst.program.body) {
    if (node.type === 'ImportDeclaration') {
      //TODO: import declarations are moved to top
      // dedupe imports
      let removed = 0
      const removeSpecifier = (i) => {
        const removeLeft = i > removed
        removed++
        const current = node.specifiers[i]
        const next = node.specifiers[i + 1]
        _s.remove(
            removeLeft ? node.specifiers[i - 1].end + startOffset : current.start + startOffset,
            next && !removeLeft ? next.start + startOffset : current.end + startOffset
        )
      }
      // 判断defineProps等是否有被引入
      // record imports for dedupe
      for (let i = 0; i < node.specifiers.length; i++) {
        const specifier = node.specifiers[i]
        const imported = specifier.type === 'ImportSpecifier' && specifier.imported.type === 'Identifier' && specifier.imported.name
        const local = specifier.local.name
        const source = node.source.value
        const existing = userImports[local]
        if (source === MPX_CORE && isCompilerMacro(imported)) {
          console.warn('`\\`${imported}\\` is a compiler macro and no longer needs to be imported.`')
          // 不需要经过
          removeSpecifier(i)
        } else if(existing) {
          if (existing.source === source && existing.imported === imported) {
            // already imported in <script setup>, dedupe
            removeSpecifier(i)
          } else {
            console.error(`different imports aliased to same local name.`, specifier)
          }
        } else {
          registerUserImport(
              node.source.value,
              specifier.local.name,
              imported,
              node.importKind === 'type' ||
              (specifier.type === 'ImportSpecifier' &&
                  specifier.importKind === 'type'),
              true
          )
        }
      }
      startOffset = node.loc.end.index
    }

    // process defineProps defineOptions useContext 等编译宏
    if (node.type === 'ExpressionStatement') {
      if (processDefineProps(node.expression)) {
        _s.remove(node.start, node.end)
      }
    }

    if (node.type === 'VariableDeclaration' && !node.declare) {
      const total = node.declarations.length
      let left = total
      for (let i =0; i < total; i++) {
        const decl = node.declarations[i]
        if (decl.init) {
          const isDefineProps = processDefineProps(decl.init, decl.id)
          if (isDefineProps) {
            if (left === 1) {
              _s.remove(node.start + startOffset, node.end + startOffset)
            } else {
              let start = decl.start + startOffset
              let end = decl.end + startOffset
              if (i < total - 1) {
                // not the last one, locate the start of the next
                end = node.declarations[i + 1].start + startOffset
              } else {
                // last one, locate the end of the prev
                start = node.declarations[i - 1].end + startOffset
              }
              _s.remove(start, end)
              left--
            }
          }

        }
      }
    }

    if (
        (node.type === 'VariableDeclaration' ||
            node.type === 'FunctionDeclaration' ||
            node.type === 'ClassDeclaration') &&
        !node.declare
    ) {
      walkDeclaration(node, setupBindings, userImportAlias)
    }
    endOffset = node.loc.end.index
  }
  // 3. Apply reactivity transform

  // 4. extract runtime props/emits code from setup context type
  if (propsTypeDecl) {
    extractRuntimeProps(propsTypeDecl, typeDeclaredProps, declaredTypes, isProd)
  }

  // 9. finalize setup() argument signature
  let args = `__props`

  let exposeCall = ''

  // 10. generate return statement
  let returned
  const allBindings = {
    ...scriptBindings,
    ...setupBindings
  };
  for (const key in userImports) {
    if (!userImports[key].isType && userImports[key].isUsedInTemplate) {
      allBindings[key] = true;
    }
  }
  returned = `{ ${Object.keys(allBindings).join(', ')} }`;


  let runtimeOptions = ``


  _s.appendRight(endOffset, `\nreturn ${returned}\n}\n\n`)

  _s.prependLeft(
      startOffset,
      `\ncreateComponent ({${runtimeOptions}\n  ` +
      `${hasAwait ? `async ` : ``}setup(${args}) {\n${exposeCall}`
  )
  _s.appendRight(endOffset, `})`)

  return {
    content: _s.toString()
  }
}

module.exports = {
  compileScriptSetup
}
