const babylon = require('@babel/parser')
var MagicString = require('magic-string')

// Special compiler macros
const DEFINE_PROPS = 'defineProps'
const DEFINE_OPTIONS = 'defineOptions'
const USE_CONTEXT = 'useContext'

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

function registerUserImport(
  source: string,
  local: string,
  imported: string | false,
  isType: boolean,
  isFromSetup: boolean,
  needTemplateUsageCheck: boolean
) {
  if (source === 'vue' && imported) {
    userImportAlias[imported] = local
  }

  // template usage check is only needed in non-inline mode, so we can skip
  // the work if inlineTemplate is true.
  let isUsedInTemplate = needTemplateUsageCheck
  if (
    needTemplateUsageCheck &&
    isTS &&
    sfc.template &&
    !sfc.template.src &&
    !sfc.template.lang
  ) {
    isUsedInTemplate = isImportUsed(local, sfc)
  }

  userImports[local] = {
    isType,
    imported: imported || 'default',
    source,
    isFromSetup,
    isUsedInTemplate
  }
}

function walkDeclaration(node, bindings, userImportAlias) {
  if (node.type === 'VariableDeclaration') {
    const isConst = node.kind === 'const'
    for (const { id, init } of node.declarations) {
      const isDefineCall = !!(
        isConst &&
        isCallOf(
          init,
          c => c === DEFINE_PROPS || c === DEFINE_OPTIONS || c === USE_CONTEXT
        )
      )
      if (id.type === 'Identifier') {
        let bindingType
        const userReactiveBinding = userImportAlias['reactive'] || 'reactive'

      }

    }
  } else if (node.type === 'FunctionDeclaration') {

  } else if (node.type === 'ClassDeclaration') {

  }

}

function compileScriptSetup(content, options) {
  const _s = new MagicString(content)
  const scriptBindings = Object.create(null)
  const setupBindings = Object.create(null)
  const userImportAlias = Object.create(null)

  let startOffset = 0
  let endOffset = 0
  let hasAwait = false

  const scriptSetupAst = babylon.parse(content, {
    plugins: [
      'topLevelAwait'
    ],
    sourceType: 'module'
  })
  for (const node of scriptSetupAst.program.body) {
    if (node.type === 'ImportDeclaration') {
      // record imports for dedupe
      for (const specifier of node.specifiers) {
        const imported = specifier.type === 'ImportSpecifier' && specifier.imported.type === 'Identifier' && specifier.imported.name
        registerUserImport(
          node.source.value,
          specifier.local.name,
          imported,
          node.importKind === 'type' ||
          (specifier.type === 'ImportSpecifier' &&
            specifier.importKind === 'type'),
          false,
          !options.inlineTemplate
        )
      }
      startOffset = node.loc.end.index
    } else if (node.type === 'VariableDeclaration' || node.type === 'FunctionDeclaration' || node.type === 'ClassDeclaration') {
      walkDeclaration(node, setupBindings)
    }
    endOffset = node.loc.end.index
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


  s.appendRight(endOffset, `\nreturn ${returned}\n}\n\n`)

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
