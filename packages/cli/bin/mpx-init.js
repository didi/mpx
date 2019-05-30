#!/usr/bin/env node

const download = require('download-git-repo')
const program = require('commander')
const exists = require('fs').existsSync
const path = require('path')
const ora = require('ora')
const home = require('user-home')
const chalk = require('chalk')
const tildify = require('tildify')
const inquirer = require('inquirer')
const rm = require('rimraf').sync
const logger = require('../lib/logger')
const generate = require('../lib/generate')
const checkVersion = require('../lib/check-version')
const localPath = require('../lib/local-path')
const pkg = require('../package.json')
const updateNotifier = require('update-notifier')

const isLocalPath = localPath.isLocalPath
const getTemplatePath = localPath.getTemplatePath

/**
 * Usage.
 */

program
  .usage('[project-name]')
  .option('-c, --clone', 'use git clone')
  .option('--offline', 'use cached template')
  .on('--help', () => {
    console.log()
    console.log('  Examples:')
    console.log()
    console.log(chalk.gray('    # create a new project with the specified dirname'))
    console.log('    $ mpx init awesome-project')
    console.log()
    console.log(chalk.gray('    # create a new project in current directory'))
    console.log('    $ mpx init')
    console.log()
  })
  .parse(process.argv)

/**
 * Settings.
 */

let template = 'mpx-template'
const rawName = program.args[0]
const inPlace = !rawName || rawName === '.'
const name = inPlace ? path.relative('../', process.cwd()) : rawName
const to = path.resolve(rawName || '.')
const clone = program.clone || false

const tmp = path.join(home, '.mpx-templates', template)
if (program.offline) {
  console.log(`> Use cached template at ${chalk.yellow(tildify(tmp))}`)
  template = tmp
}

updateNotifier({ pkg, updateCheckInterval: 0 }).notify({ isGlobal: true })

/**
 * Padding.
 */

console.log()
process.on('exit', () => {
  console.log()
})

if (inPlace || exists(to)) {
  inquirer.prompt([{
    type: 'confirm',
    message: inPlace
      ? 'Generate project in current directory?'
      : 'Target directory exists. Continue?',
    name: 'ok'
  }]).then(answers => {
    if (answers.ok) {
      run()
    }
  }).catch(logger.fatal)
} else {
  run()
}

/**
 * Check, download and generate the project.
 */

function run () {
  // check if template is local
  if (isLocalPath(template)) {
    const templatePath = getTemplatePath(template)
    if (exists(templatePath)) {
      generate(name, templatePath, to, err => {
        if (err) logger.fatal(err)
        console.log()
        logger.success('Generated "%s".', name)
      })
    } else {
      logger.fatal('Local template "%s" not found.', template)
    }
  } else {
    checkVersion(() => {
      // use official templates
      const officialTemplate = 'mpx-ecology/' + template
      downloadAndGenerate(officialTemplate)
    })
  }
}

/**
 * Download a generate from a template repo.
 *
 * @param {String} template
 */

function downloadAndGenerate (template) {
  const spinner = ora('downloading template')
  spinner.start()
  // Remove if local template exists
  if (exists(tmp)) rm(tmp)
  download(template, tmp, { clone }, err => {
    spinner.stop()
    if (err) logger.fatal('Failed to download repo ' + template + ': ' + err.message.trim())
    generate(name, tmp, to, err => {
      if (err) logger.fatal(err)
      console.log()
      logger.success('Generated "%s".', name)
    })
  })
}
