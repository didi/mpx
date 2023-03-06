const ts = require('typescript')
const run = require('./postbuild')

const formatHost = {
  getCanonicalFileName: (path) => path,
  getCurrentDirectory: ts.sys.getCurrentDirectory,
  getNewLine: () => ts.sys.newLine
}

function watchMain () {
  const configPath = ts.findConfigFile(/* searchPath */ './', ts.sys.fileExists, 'tsconfig.json')
  if (!configPath) {
    throw new Error("Could not find a valid 'tsconfig.json'.")
  }

  const createProgram = ts.createSemanticDiagnosticsBuilderProgram

  const host = ts.createWatchCompilerHost(
    configPath,
    {},
    ts.sys,
    createProgram,
    reportDiagnostic,
    reportWatchStatusChanged
  )

  const origCreateProgram = host.createProgram
  host.createProgram = (rootNames, options, host, oldProgram) => {
    return origCreateProgram(rootNames, options, host, oldProgram)
  }
  const origPostProgramCreate = host.afterProgramCreate

  host.afterProgramCreate = (program) => {
    origPostProgramCreate(program)
    run()
  }

  ts.createWatchProgram(host)
}

function reportDiagnostic (diagnostic) {
  console.error(ts.flattenDiagnosticMessageText(diagnostic.messageText, formatHost.getNewLine()))
}

function reportWatchStatusChanged (diagnostic) {
  let message = ts.formatDiagnostic(diagnostic, formatHost)
  if (message.indexOf('TS6194') > 0) {
    message = message.replace(/message\sTS[0-9]{4}:(.+)(\s+)$/, '$1')
    console.log(message)
  }
}

watchMain()
