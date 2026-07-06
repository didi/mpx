#!/usr/bin/env node
'use strict'

const fs = require('fs')
const path = require('path')
const u = require('./review-loop-utils')

const roles = ['planner', 'plan-reviewer', 'coder', 'code-reviewer']

function roleTemplatePath (role) {
  return path.join(u.skillRoot(), 'templates', 'roles', role + '.md')
}

function allExist (files) {
  return files.every(function (file) {
    return fs.existsSync(file)
  })
}

function codexToml (role, instructions) {
  const description = {
    planner: 'Planner for review-loop workflows.',
    'plan-reviewer': 'Plan reviewer for review-loop workflows.',
    coder: 'Coder for review-loop workflows.',
    'code-reviewer': 'Code reviewer for review-loop workflows.'
  }[role]
  return [
    'name = "' + role + '"',
    'description = "' + description + '"',
    'developer_instructions = """',
    instructions.replace(/"""/g, '\\"\\"\\"'),
    '"""',
    ''
  ].join('\n')
}

function writeTemporaryRoles (taskId) {
  const dir = path.join(u.taskDir(taskId), 'runtime', 'roles')
  roles.forEach(function (role) {
    u.copyFile(roleTemplatePath(role), path.join(dir, role + '.md'))
  })
  return dir
}

function writeProjectRoles (platform) {
  if (platform === 'codex') {
    const dir = path.join(u.repoRoot(), '.codex', 'agents')
    u.ensureDir(dir)
    roles.forEach(function (role) {
      const instructions = u.readText(roleTemplatePath(role))
      u.writeText(path.join(dir, role + '.toml'), codexToml(role, instructions))
    })
    return dir
  }
  if (platform === 'claude-code') {
    const dir = path.join(u.repoRoot(), '.claude', 'agents')
    u.ensureDir(dir)
    roles.forEach(function (role) {
      u.copyFile(roleTemplatePath(role), path.join(dir, role + '.md'))
    })
    return dir
  }
  u.fail('Unsupported --platform: ' + platform)
}

function projectRoleFiles (platform) {
  if (platform === 'codex') {
    return roles.map(function (role) {
      return path.join(u.repoRoot(), '.codex', 'agents', role + '.toml')
    })
  }
  if (platform === 'claude-code') {
    return roles.map(function (role) {
      return path.join(u.repoRoot(), '.claude', 'agents', role + '.md')
    })
  }
  u.fail('Unsupported --platform: ' + platform)
}

function main () {
  const args = u.parseArgs(process.argv)
  const taskId = args['task-id']
  const platform = args.platform
  if (!taskId) u.fail('Missing --task-id')
  if (!platform) u.fail('Missing --platform codex|claude-code')
  if (args['subagents-supported'] === 'false') {
    u.fail('review-loop requires real subagent support. Current platform cannot create subagents.', 3)
  }

  const state = u.readState(taskId)
  const mode = args.mode || 'auto'
  const projectFiles = projectRoleFiles(platform)
  let roleDir = ''
  let roleMode = ''
  let status = 'ready'

  if (mode === 'auto') {
    if (allExist(projectFiles)) {
      roleMode = 'project'
      roleDir = path.dirname(projectFiles[0])
    } else {
      status = 'needs_choice'
    }
  } else if (mode === 'temporary') {
    roleMode = 'temporary'
    roleDir = writeTemporaryRoles(taskId)
  } else if (mode === 'project') {
    roleMode = 'project'
    roleDir = writeProjectRoles(platform)
  } else {
    u.fail('--mode must be auto, temporary, or project')
  }

  state.platform = platform
  state.roleMode = roleMode
  state.roleDir = roleDir
  state.updatedAt = new Date().toISOString()
  u.writeState(taskId, state)

  process.stdout.write(JSON.stringify({
    ok: true,
    status: status,
    platform: platform,
    mode: roleMode,
    roleDir: roleDir,
    choices: status === 'needs_choice' ? ['temporary', 'project'] : []
  }, null, 2) + '\n')
}

try {
  main()
} catch (err) {
  console.error(err.message)
  process.exit(err.exitCode || 1)
}
