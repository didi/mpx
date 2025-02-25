const babylon = require('@babel/parser')
const MagicString = require('magic-string')
const { SourceMapConsumer, SourceMapGenerator } = require('source-map')
const traverse = require('@babel/traverse').default
const t = require('@babel/types')
const formatCodeFrame = require('@babel/code-frame')
const parseRequest = require('../utils/parse-request')

// Special compiler macros
const DEFINE_PROPS = 'defineProps'
const DEFINE_OPTIONS = 'defineOptions'
const DEFINE_EXPOSE = 'defineExpose'
const WITH_DEFAULTS = 'withDefaults'

const MPX_CORE = '@mpxjs/core'

const BindingTypes = {
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

function compileScriptSetup (
  scriptSetup,
  ctorType,
  filePath
) {
  const content = scriptSetup.content
  const _s = new MagicString(content)
  const scriptBindings = Object.create(null)
  const setupBindings = Object.create(null)
  const userImportAlias = Object.create(null)
  const userImports = Object.create(null)
  // const genSourceMap = false

  let startOffset = 0
  let endOffset = 0
  let hasDefinePropsCall = false
  let hasDefineOptionsCall = false
  let hasDefineExposeCall = false

  let propsRuntimeDecl
  let propsRuntimeDefaults
  let propsTypeDeclRaw
  let propsTypeDecl
  let propsIdentifier
  let optionsRuntimeDecl
  let exposeRuntimeDecl

  const scriptSetupLang = scriptSetup && scriptSetup.lang
  const isTS =
    scriptSetupLang === 'ts' ||
    scriptSetupLang === 'tsx'
  const plugins = []

  if (isTS) plugins.push('typescript', 'decorators-legacy')

  // props/emits declared via types
  const typeDeclaredProps = {}
  const declaredTypes = {}

  function error (
    msg,
    node,
    end
  ) {
    if (node) {
      throw new Error(
        `[@mpxjs/webpack-plugin script-setup-compiler] ${msg}\n\n${filePath}\n${formatCodeFrame(
          content,
          node.start + startOffset,
          end
        )}`
      )
    } else {
      throw new Error(
        `[@mpxjs/webpack-plugin script-setup-compiler] ${msg}\n\n${filePath}\n`
      )
    }
  }

  function registerUserImport (
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

  function processDefineExpose (node, declId) {
    if (!isCallOf(node, DEFINE_EXPOSE)) {
      return false
    }
    if (hasDefineExposeCall) {
      error(`duplicate ${DEFINE_EXPOSE}() call`, node)
    }
    hasDefineExposeCall = true
    exposeRuntimeDecl = node.arguments[0]

    if (node.typeParameters) {
      error(`${DEFINE_EXPOSE} is not support type parameters`, node)
    }

    if (declId) {
      console.warn(`${DEFINE_OPTIONS} no return value, please check it`, declId)
    }

    return true
  }

  function processDefineOptions (node, declId) {
    if (!isCallOf(node, DEFINE_OPTIONS)) {
      return false
    }
    if (hasDefineOptionsCall) {
      error(`duplicate ${DEFINE_OPTIONS}() call`, node)
    }
    hasDefineOptionsCall = true
    const arg0 = node.arguments[0]
    if (arg0.type === 'ObjectExpression') {
      optionsRuntimeDecl = arg0.properties
    } else {
      error(`${DEFINE_OPTIONS} input parameter must be an object`)
    }

    if (node.typeParameters) {
      error(`${DEFINE_OPTIONS} is not support type parameters`, node)
    }

    if (declId) {
      console.warn(`${DEFINE_OPTIONS} no return value, please check it`, declId)
    }
    return true
  }

  function processDefineProps (node, declId) {
    if (!isCallOf(node, DEFINE_PROPS)) {
      return false
    }
    if (hasDefinePropsCall) {
      error(`duplicate ${DEFINE_PROPS}() call`, node)
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
        error(
          `${DEFINE_PROPS}() cannot accept both type and non-type arguments ` +
          'at the same time. Use one or the other.',
          node
        )
      }

      propsTypeDeclRaw = node.typeParameters.params[0]
      propsTypeDecl = resolveQualifiedType(
        propsTypeDeclRaw,
        node => node.type === 'TSFunctionType' || node.type === 'TSTypeLiteral'
      )

      if (!propsTypeDecl) {
        error(
          `type argument passed to ${DEFINE_PROPS}() must be a literal type, ` +
          'or a reference to an interface or literal type.',
          propsTypeDeclRaw
        )
      }
    }

    // 处理 VariableDeclaration declarations id
    if (declId) {
      propsIdentifier = content.slice(declId.start, declId.end)
    }
    return true
  }

  function processWithDefaults (node, declId) {
    if (!isCallOf(node, WITH_DEFAULTS)) {
      return false
    }
    if (processDefineProps(node.arguments[0], declId)) {
      if (propsRuntimeDecl) {
        error(
          `${WITH_DEFAULTS} can only be used with type-based ` +
          `${DEFINE_PROPS} declaration.`,
          node
        )
      }
      propsRuntimeDefaults = node.arguments[1]
      if (
        !propsRuntimeDefaults ||
        propsRuntimeDefaults.type !== 'ObjectExpression'
      ) {
        error(
          `The 2nd argument of ${WITH_DEFAULTS} must be an object literal.`,
          propsRuntimeDefaults || node
        )
      }
    } else {
      error(
        `${WITH_DEFAULTS}' first argument must be a ${DEFINE_PROPS} call.`,
        node.arguments[0] || node
      )
    }
    return true
  }

  function resolveQualifiedType (node, qualifier) {
    if (qualifier(node)) {
      return node
    }
    // TSTypeReference defineProps<Props>()
    if (node.type === 'TSTypeReference' && node.typeName.type === 'Identifier') {
      const refName = node.typeName.name
      const isQualifiedType = (node) => {
        // interface Props TSInterfaceDeclaration
        if (node.type === 'TSInterfaceDeclaration' && node.id.name === refName) {
          return node.body
        }
        // type Props TSTypeAliasDeclaration
        if (node.type === 'TSTypeAliasDeclaration' && node.id.name === refName && qualifier(node.typeAnnotation)) {
          return node.typeAnnotation
        }
        // export type Props
        if (node.type === 'ExportNamedDeclaration' && node.declaration) {
          return isQualifiedType(node.declaration)
        }
      }
      const body = scriptSetupAst.program.body
      for (const node of body) {
        const qualified = isQualifiedType(node)
        if (qualified) {
          return qualified
        }
      }
    }
  }

  function hasStaticWithDefaults () {
    return (
      propsRuntimeDefaults &&
      propsRuntimeDefaults.type === 'ObjectExpression' &&
      propsRuntimeDefaults.properties.every(
        node =>
          (node.type === 'ObjectProperty' && !node.computed) ||
          node.type === 'ObjectMethod'
      )
    )
  }

  function genRuntimeProps (props) {
    const keys = Object.keys(props)
    if (!keys.length) {
      return ''
    }
    const hasStaticDefaults = hasStaticWithDefaults()
    const scriptSetupSource = content
    const propsDecls = `{
    ${keys.map(key => {
      let defaultString
      if (hasStaticDefaults) {
        const prop = propsRuntimeDefaults.properties.find(
          node => node.key.name === key
        )
        if (prop) {
          if (prop.type === 'ObjectProperty') {
            defaultString = `value: ${scriptSetupSource.slice(
              prop.value.start,
              prop.value.end
            )}`
          }
        }
      }
      const { type } = props[key]
      const propRuntimeTypes = toRuntimeTypeString(type)
      if (propRuntimeTypes.optionalTypes) {
        return `${key}: { type: ${propRuntimeTypes.type}, optionalTypes: ${propRuntimeTypes.optionalTypes}${
          defaultString ? `, ${defaultString}` : ''
          } }`
      } else {
        return `${key}: { type: ${propRuntimeTypes.type}${
          defaultString ? `, ${defaultString}` : ''
          } }`
      }
    }).join(',\n    ')}
    }`

    return `\n  properties: ${propsDecls},`
  }

  function checkInvalidScopeReference (node, method) {
    if (!node) return
    walkIdentifiers(node, id => {
      if (setupBindings[id.name]) {
        error(
          `\`${method}()\` in <script setup> cannot reference locally ` +
          'declared variables because it will be hoisted outside of the ' +
          'setup() function.',
          id
        )
      }
    })
  }

  // 1. parse <script setup> and  walk over top level statements
  const scriptSetupAst = babylon.parse(content, {
    plugins: [
      ...plugins,
      'topLevelAwait'
    ],
    sourceType: 'module'
  })
  for (const node of scriptSetupAst.program.body) {
    const start = node.start
    let end = node.end

    // 定位comment，例如 var a= 1; // a为属性
    if (node.trailingComments && node.trailingComments.length > 0) {
      const lastCommentNode =
        node.trailingComments[node.trailingComments.length - 1]
      end = lastCommentNode.end
    }

    // locate the end of whitespace between this statement and the next
    while (end <= content.length) {
      if (!/\s/.test(content.charAt(end))) {
        break
      }
      end++
    }

    if (node.type === 'ImportDeclaration') {
      // import declarations are moved to top
      _s.move(start, end, 0)
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
        let imported = specifier.type === 'ImportSpecifier' && specifier.imported.type === 'Identifier' && specifier.imported.name
        if (specifier.type === 'ImportNamespaceSpecifier') {
          imported = '*'
        }
        const local = specifier.local.name
        const source = node.source.value
        const existing = userImports[local]
        if (source === MPX_CORE && isCompilerMacro(imported)) {
          console.warn(`${imported} is a compiler macro and no longer needs to be imported.`)
          // 不需要经过
          removeSpecifier(i)
        } else if (existing) {
          if (existing.source === source && existing.imported === imported) {
            // already imported in <script setup>, dedupe
            removeSpecifier(i)
          } else {
            error('different imports aliased to same local name.', specifier)
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
      if (node.specifiers.length && removed === node.specifiers.length) {
        _s.remove(node.start, node.end)
      }
      startOffset = node.loc.end.index
    }

    // process defineProps defineOptions 等编译宏
    if (node.type === 'ExpressionStatement') {
      if (
        processDefineProps(node.expression) ||
        processDefineOptions(node.expression) ||
        processDefineExpose(node.expression) ||
        processWithDefaults(node.expression)
      ) {
        _s.remove(node.start, node.end)
      }
    }

    if (node.type === 'VariableDeclaration' && !node.declare) {
      const total = node.declarations.length
      let left = total
      for (let i = 0; i < total; i++) {
        const decl = node.declarations[i]
        if (decl.init) {
          const isDefineProps = processDefineProps(decl.init, decl.id) || processWithDefaults(decl.init, decl.id)
          const isDefineOptions = processDefineOptions(decl.init, decl.id)
          if (isDefineProps || isDefineOptions) {
            if (left === 1) {
              _s.remove(node.start, node.end)
            } else {
              // let a,b = defineProps({})
              let start = decl.start
              let end = decl.end
              if (i < total - 1) {
                // not the last one, locate the start of the next
                end = node.declarations[i + 1].start
              } else {
                // last one, locate the end of the prev
                start = node.declarations[i - 1].end
              }
              _s.remove(start, end)
              left--
            }
          }
        }
      }
    }

    // walk declarations to record declared bindings
    if (
      (node.type === 'VariableDeclaration' ||
        node.type === 'FunctionDeclaration' ||
        node.type === 'ClassDeclaration') &&
      !node.declare
    ) {
      walkDeclaration(node, setupBindings, userImportAlias)
    }

    // walk statements & named exports / variable declarations for top level
    // await，when find await will throw error
    // { await someFunc ()}
    if (
      (node.type === 'VariableDeclaration' && !node.declare) ||
      node.type.endsWith('Statement')
    ) {
      const scope = [scriptSetupAst.body]
      traverse(node, {
        enter (path) {
          if (isFunctionType(path.node)) {
            path.skip()
          }
          if (t.isBlockStatement(path.node)) {
            scope.push(path.node.body)
          }
          if (t.isAwaitExpression(path.node)) {
            // error
            error('if the await expression is an expression statement and is in the root scope or is not the first statement in a nested block scope, this is not support in miniprogram')
          }
        },
        exit (path) {
          if (t.isBlockStatement(path.node)) scope.pop()
        },
        noScope: true
      })
    }

    if (
      (node.type === 'ExportNamedDeclaration' && node.exportKind !== 'type') ||
      node.type === 'ExportAllDeclaration' ||
      node.type === 'ExportDefaultDeclaration'
    ) {
      error(
        '<script setup> cannot contain ES module exports. ',
        node
      )
    }

    // working with TS code
    if (isTS) {
      if (
        node.type.startsWith('TS') ||
        (node.type === 'ExportNamedDeclaration' &&
          node.exportKind === 'type') ||
        (node.type === 'VariableDeclaration' && node.declare)
      ) {
        recordType(node, declaredTypes)
        _s.move(node.start, node.end + 1, 0)
      }
    }

    endOffset = node.loc.end.index
  }

  // 2. extract runtime props code from setup context type
  if (propsTypeDecl) {
    // TS defineProps 提取Props
    extractRuntimeProps(propsTypeDecl, typeDeclaredProps, declaredTypes)
  }

  // 3. check useOptions args to make sure it doesn't reference setup scope
  checkInvalidScopeReference(propsRuntimeDecl, DEFINE_PROPS)
  checkInvalidScopeReference(optionsRuntimeDecl, DEFINE_OPTIONS)

  // 4. finalize setup() argument signature
  let args = '__props'
  if (propsTypeDecl) {
    args += ': any'
  }
  // inject user assignment of props
  if (propsIdentifier) {
    _s.prependLeft(
      startOffset,
      `\nconst ${propsIdentifier} = __props${
        propsTypeDecl ? ' as any' : ''
        }\n`)
  }
  // args 添加 __context
  args += `, __context${isTS ? ': any' : ''}`

  // 5. generate return statement
  let returned
  if (hasDefineExposeCall && exposeRuntimeDecl) {
    const declCode = content.slice(exposeRuntimeDecl.start, exposeRuntimeDecl.end).trim()
    returned = `${declCode}`
  } else {
    const allBindings = {
      ...scriptBindings,
      ...setupBindings
    }
    for (const key in userImports) {
      // import 进的的变量或方法，非mpxjs/core中的，暂时都进行return
      if (!userImports[key].isType && !userImportAlias[key]) {
        allBindings[key] = true
      }
    }
    returned = `{ ${Object.keys(allBindings).join(', ')} }`
  }
  _s.appendRight(endOffset, `\nreturn ${returned}\n}\n\n`)

  // 6. finalize default export
  let runtimeOptions = ''
  if (propsRuntimeDecl) {
    const declCode = content.slice(propsRuntimeDecl.start, propsRuntimeDecl.end).trim()
    runtimeOptions += `\n  properties: ${declCode},`
  } else if (propsTypeDecl) {
    runtimeOptions += genRuntimeProps(typeDeclaredProps)
  }

  if (optionsRuntimeDecl) {
    for (const node of optionsRuntimeDecl) {
      if (node.key.name === 'properties' && hasDefinePropsCall) {
        console.warn(`${DEFINE_PROPS} has been called, ${DEFINE_OPTIONS} set properties will be ignored`)
      } else {
        const declCode = content.slice(node.value.start, node.value.end).trim()
        runtimeOptions += `\n ${node.key.name}: ${declCode},`
      }
    }
  }

  // 添加defineExpose强制配置校验
  if (!hasDefineExposeCall) {
    error('Mpx script setup must define the variables for return using defineExpose, see details: https://mpxjs.cn/guide/composition-api/composition-api.html#defineexpose')
  }

  // import {createComponent} from '@mpxjs/core' 添加是否已有import判断
  const ctor = getCtor(ctorType)
  _s.prependLeft(
    startOffset,
    `\nimport {${ctor}} from '${MPX_CORE}'\n${getCtor(ctorType)} ({${runtimeOptions}\n  ` +
      `setup(${args}) {\n const useContext = () => { return __context }\n`
  )
  _s.appendRight(endOffset, '})')

  return {
    content: _s.toString(),
    map: _s.generateMap({
      source: filePath,
      hires: true,
      includeContent: true,
    })
  }
}

function isCallOf (
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

function canNeverBeRef (
  node,
  userReactiveImport
) {
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

function isCompilerMacro (c) {
  return c === DEFINE_PROPS || c === DEFINE_OPTIONS || c === DEFINE_EXPOSE
}

function registerBinding (
  bindings,
  node,
  type
) {
  bindings[node.name] = type
}

function walkDeclaration (
  node,
  bindings,
  userImportAlias
) {
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
        const userReactiveBinding = userImportAlias.reactive || 'reactive'
        // 是否是 reactive init
        if (isCallOf(init, userReactiveBinding)) {
          bindingType = isConst
            ? BindingTypes.SETUP_REACTIVE_CONST
            : BindingTypes.SETUP_LET
        } else if (
          isDefineCall ||
          (isConst && canNeverBeRef(init, userReactiveBinding))
        ) {
          bindingType = isCallOf(init, DEFINE_PROPS)
            ? BindingTypes.SETUP_REACTIVE_CONST
            : BindingTypes.SETUP_CONST
        } else if (isConst) {
          if (isCallOf(init, userImportAlias.ref || 'ref')) {
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

function walkObjectPattern (
  node,
  bindings,
  isConst,
  isDefineCall = false
) {
  for (const p of node.properties) {
    if (p.type === 'ObjectProperty') {
      if (p.key.type === 'Identifier' && p.key === p.value) {
        // shorthand: const { x } = ...
        const type = isDefineCall ? BindingTypes.SETUP_CONST : isConst ? BindingTypes.SETUP_MAYBE_REF : BindingTypes.SETUP_LET
        registerBinding(bindings, p.key, type)
      } else {
        walkPattern(p.value, bindings, isConst, isDefineCall)
      }
    } else {
      // ...rest
      const type = isConst ? BindingTypes.SETUP_CONST : BindingTypes.SETUP_LET
      registerBinding(bindings, p.argument, type)
    }
  }
}

function walkArrayPattern (
  node,
  bindings,
  isConst,
  isDefineCall = false
) {
  for (const e of node.elements) {
    e && walkPattern(e, bindings, isConst, isDefineCall)
  }
}

function walkPattern (
  node,
  bindings,
  isConst,
  isDefineCall = false
) {
  if (node.type === 'Identifier') {
    const type = isDefineCall
      ? BindingTypes.SETUP_CONST
      : isConst
        ? BindingTypes.SETUP_MAYBE_REF
        : BindingTypes.SETUP_LET
    registerBinding(bindings, node, type)
  } else if (node.type === 'RestElement') {
    const type = isConst ? BindingTypes.SETUP_CONST : BindingTypes.SETUP_LET
    registerBinding(bindings, node.argument, type)
  } else if (node.type === 'ObjectPattern') {
    walkObjectPattern(node, bindings, isConst)
  } else if (node.type === 'ArrayPattern') {
    walkArrayPattern(node, bindings, isConst)
  } else if (node.type === 'AssignmentPattern') {
    // const {propsA:c=2} = defineProps
    if (node.left.type === 'Identifier') {
      const type = isDefineCall
        ? BindingTypes.SETUP_CONST
        : isConst
          ? BindingTypes.SETUP_MAYBE_REF
          : BindingTypes.SETUP_LET
      registerBinding(bindings, node.left, type)
    } else {
      walkPattern(node.left, bindings, isConst)
    }
  }
}

function recordType (node, declaredTypes) {
  if (node.type === 'TSInterfaceDeclaration') {
    declaredTypes[node.id.name] = ['Object']
  } else if (node.type === 'TSTypeAliasDeclaration') {
    declaredTypes[node.id.name] = inferRuntimeType(
      node.typeAnnotation,
      declaredTypes
    )
  } else if (node.type === 'ExportNamedDeclaration' && node.declaration) {
    recordType(node.declaration, declaredTypes)
  }
}

function toRuntimeTypeString (types) {
  return {
    type: types[0],
    optionalTypes: types.length > 1 ? `[${types.slice(1).join(', ')}]` : undefined
  }
}

// extract runtime props from ts types
function extractRuntimeProps (
  node,
  props,
  declaredTypes
) {
  const members = node.type === 'TSTypeLiteral' ? node.members : node.body
  for (const m of members) {
    if (
      (m.type === 'TSPropertySignature' || m.type === 'TSMethodSignature') &&
      m.key.type === 'Identifier'
    ) {
      let type
      if (m.type === 'TSMethodSignature') {
        type = ['Function']
      } else if (m.typeAnnotation) {
        type = inferRuntimeType(m.typeAnnotation.typeAnnotation, declaredTypes)
      }
      props[m.key.name] = {
        key: m.key.name,
        required: !m.optional,
        type: type || ['null']
      }
    }
  }
}

function inferRuntimeType (
  node,
  declaredTypes
) {
  switch (node.type) {
    case 'TSStringKeyword':
      return ['String']
    case 'TSNumberKeyword':
      return ['Number']
    case 'TSBooleanKeyword':
      return ['Boolean']
    case 'TSObjectKeyword':
      return ['Object']
    case 'TSFunctionType':
      return ['Function']
    case 'TSArrayType':
    case 'TSTupleType':
      return ['Array']
    case 'TSLiteralType':
      switch (node.literal.type) {
        case 'StringLiteral':
          return ['String']
        case 'BooleanLiteral':
          return ['Boolean']
        case 'NumericLiteral':
        case 'BigIntLiteral':
          return ['Number']
        default:
          return ['null']
      }

    case 'TSTypeReference':
      if (node.typeName.type === 'Identifier') {
        if (declaredTypes[node.typeName.name]) {
          return declaredTypes[node.typeName.name]
        }
        switch (node.typeName.name) {
          case 'Array':
          case 'Function':
          case 'Object':
          case 'Set':
          case 'Map':
          case 'WeakSet':
          case 'WeakMap':
          case 'Date':
          case 'Promise':
            return [node.typeName.name]
          case 'Record':
          case 'Partial':
          case 'Readonly':
          case 'Pick':
          case 'Omit':
          case 'Exclude':
          case 'Extract':
          case 'Required':
          case 'InstanceType':
            return ['Object']
        }
      }
      return ['null']

    case 'TSParenthesizedType':
      return inferRuntimeType(node.typeAnnotation, declaredTypes)

    case 'TSUnionType':
      return [
        ...new Set(
          [].concat(
            ...(node.types.map(t => inferRuntimeType(t, declaredTypes)))
          )
        )
      ]
    case 'TSIntersectionType':
      return ['Object']

    default:
      return ['null']
  }
}

function walkIdentifiers (
  root,
  onIdentifier,
  parentStack = [],
  knownIds = Object.create(null)
) {
  const rootExp =
    root.type === 'Program' &&
    root.body[0].type === 'ExpressionStatement' &&
    root.body[0].expression
  traverse(root, {
    enter (path) {
      const { node, parent } = path
      if (
        parent &&
        parent.type.startsWith('TS') &&
        parent.type !== 'TSAsExpression' &&
        parent.type !== 'TSNonNullExpression' &&
        parent.type !== 'TSTypeAssertion'
      ) {
        return path.skip()
      }
      if (node.type === 'Identifier') {
        const isLocal = knownIds[node.name]
        const isRefed = isReferencedIdentifier(node, parent, parentStack)
        if (isRefed && !isLocal) {
          onIdentifier(node, parent, parentStack, isRefed, isLocal)
        }
      } else if (
        node.type === 'ObjectProperty' &&
        parent.type === 'ObjectPattern'
      ) {
        node.inPattern = true
      } else if (isFunctionType(node)) {
        walkFunctionParams(node, id => markScopeIdentifier(node, id, knownIds))
      } else if (node.type === 'BlockStatement') {
        walkBlockDeclarations(node, id =>
          markScopeIdentifier(node, id, knownIds)
        )
      }
    },
    exit (path) {
      const { node, parent } = path
      parent && parentStack.pop()
      if (node !== rootExp && node.scopeIds) {
        for (const id of node.scopeIds) {
          knownIds[id]--
          if (knownIds[id] === 0) {
            delete knownIds[id]
          }
        }
      }
    },
    noScope: true
  })
}

function markScopeIdentifier (
  node,
  child,
  knownIds
) {
  const { name } = child
  if (node.scopeIds && node.scopeIds.has(name)) {
    return
  }
  if (name in knownIds) {
    knownIds[name]++
  } else {
    knownIds[name] = 1
  }
  (node.scopeIds || (node.scopeIds = new Set())).add(name)
}

function walkFunctionParams (
  node,
  onIdent
) {
  for (const p of node.params) {
    for (const id of extractIdentifiers(p)) {
      onIdent(id)
    }
  }
}

function walkBlockDeclarations (
  block,
  onIndent
) {
  for (const stmt of block.body) {
    if (stmt.type === 'VariableDeclaration') {
      if (stmt.declare) continue
      for (const decl of stmt.declarations) {
        for (const id of extractIdentifiers(decl.id)) {
          onIndent(id)
        }
      }
    } else if (
      stmt.type === 'FunctionDeclaration' ||
      stmt.type === 'ClassDeclaration'
    ) {
      if (stmt.declare || !stmt.id) continue
      onIndent(stmt.id)
    }
  }
}

function isReferencedIdentifier (
  id,
  parent,
  parentStack
) {
  if (!parent) {
    return true
  }

  // is a special keyword but parsed as identifier
  if (id.name === 'arguments') {
    return false
  }

  if (t.isReferenced(id, parent)) {
    return true
  }

  // babel's isReferenced check returns false for ids being assigned to, so we
  // need to cover those cases here
  switch (parent.type) {
    case 'AssignmentExpression':
    case 'AssignmentPattern':
      return true
    case 'ObjectPattern':
    case 'ArrayPattern':
      return isInDestructureAssignment(parent, parentStack)
  }
  return false
}

function extractIdentifiers (
  param,
  nodes
) {
  switch (param.type) {
    case 'Identifier':
      nodes.push(param)
      break

    case 'MemberExpression': {
      let object = param
      while (object.type === 'MemberExpression') {
        object = object.object
      }
      nodes.push(object)
      break
    }

    case 'ObjectPattern':
      for (const prop of param.properties) {
        if (prop.type === 'RestElement') {
          extractIdentifiers(prop.argument, nodes)
        } else {
          extractIdentifiers(prop.value, nodes)
        }
      }
      break

    case 'ArrayPattern':
      param.elements.forEach(element => {
        if (element) extractIdentifiers(element, nodes)
      })
      break

    case 'RestElement':
      extractIdentifiers(param.argument, nodes)
      break

    case 'AssignmentPattern':
      extractIdentifiers(param.left, nodes)
      break
  }

  return nodes
}

function isInDestructureAssignment (
  parent,
  parentStack
) {
  if (
    parent &&
    (parent.type === 'ObjectProperty' || parent.type === 'ArrayPattern')
  ) {
    let i = parentStack.length
    while (i--) {
      const p = parentStack[i]
      if (p.type === 'AssignmentExpression') {
        return true
      } else if (p.type !== 'ObjectProperty' && !p.type.endsWith('Pattern')) {
        break
      }
    }
  }
  return false
}

function isFunctionType (node) {
  return /Function(?:Expression|Declaration)$|Method$/.test(node.type)
}

function getCtor (ctorType) {
  let ctor = 'createComponent'
  switch (ctorType) {
    case 'app':
      ctor = 'createApp'
      break
    case 'page':
      ctor = 'createPage'
      break
  }
  return ctor
}

module.exports = async function (content, sourceMap) {
  const { queryObj } = parseRequest(this.resource)
  const { ctorType, lang } = queryObj
  const filePath = this.resourcePath
  const callback = this.async()
  let finalSourceMap = null
  const {
    content: callbackContent,
    map
  } = compileScriptSetup({
    content,
    lang
  }, ctorType, filePath)
  finalSourceMap = map
  if (sourceMap) {
    const compiledMapConsumer = await new SourceMapConsumer(map)
    const compiledMapGenerator = SourceMapGenerator.fromSourceMap(compiledMapConsumer)

    const originalConsumer = await new SourceMapConsumer(sourceMap)
    compiledMapGenerator.applySourceMap(
      originalConsumer,
      filePath // 需要确保与原始映射的source路径一致
    )
    finalSourceMap = compiledMapGenerator.toJSON()
  }
  callback(null, callbackContent, finalSourceMap)
}
