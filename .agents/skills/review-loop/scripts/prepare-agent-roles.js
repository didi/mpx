#!/usr/bin/env node
'use strict'

const fs = require('fs')
const path = require('path')
const u = require('./review-loop-utils')

const roles = ['planner', 'plan-reviewer', 'coder', 'code-reviewer']
const roleDescriptions = {
  planner: 'Planner for review-loop workflows.',
  'plan-reviewer': 'Plan reviewer for review-loop workflows.',
  coder: 'Coder for review-loop workflows.',
  'code-reviewer': 'Code reviewer for review-loop workflows.'
}

function roleTemplatePath (role) {
  return path.join(u.skillRoot(), 'templates', 'roles', role + '.md')
}

function allExist (files) {
  return files.every(function (file) {
    return fs.existsSync(file)
  })
}

function platformRoles (platform) {
  if (platform === 'codex' || platform === 'claude-code') return roles
  u.fail('Unsupported --platform: ' + platform)
}

function codexToml (role, instructions) {
  return [
    'name = "' + role + '"',
    'description = "' + roleDescriptions[role] + '"',
    'developer_instructions = """',
    instructions.replace(/"""/g, '\\"\\"\\"'),
    '"""',
    ''
  ].join('\n')
}

function claudeMarkdown (role, instructions) {
  return [
    '---',
    'name: ' + role,
    'description: ' + roleDescriptions[role],
    '---',
    ''
  ].join('\n') + instructions
}

function roleContent (platform, role) {
  const instructions = u.readText(roleTemplatePath(role))
  if (platform === 'codex') return codexToml(role, instructions)
  if (platform === 'claude-code') return claudeMarkdown(role, instructions)
  u.fail('Unsupported --platform: ' + platform)
}

function writeTemporaryRoles (taskId, platform) {
  const dir = path.join(u.taskDir(taskId), 'runtime', 'roles')
  platformRoles(platform).forEach(function (role) {
    u.writeText(path.join(dir, role + '.md'), roleContent(platform, role))
  })
  return dir
}

function writeProjectRoles (platform) {
  if (platform === 'codex') {
    const dir = path.join(u.repoRoot(), '.codex', 'agents')
    u.ensureDir(dir)
    platformRoles(platform).forEach(function (role) {
      u.writeText(path.join(dir, role + '.toml'), roleContent(platform, role))
    })
    return dir
  }
  if (platform === 'claude-code') {
    const dir = path.join(u.repoRoot(), '.claude', 'agents')
    u.ensureDir(dir)
    platformRoles(platform).forEach(function (role) {
      u.writeText(path.join(dir, role + '.md'), roleContent(platform, role))
    })
    return dir
  }
  u.fail('Unsupported --platform: ' + platform)
}

function staleProjectRoles (platform, files) {
  const preparedRoles = platformRoles(platform)
  return files.filter(function (file, index) {
    return fs.existsSync(file) && u.readText(file) !== roleContent(platform, preparedRoles[index])
  }).map(function (file) {
    return path.basename(file)
  })
}

function projectRoleFiles (platform) {
  if (platform === 'codex') {
    return platformRoles(platform).map(function (role) {
      return path.join(u.repoRoot(), '.codex', 'agents', role + '.toml')
    })
  }
  if (platform === 'claude-code') {
    return platformRoles(platform).map(function (role) {
      return path.join(u.repoRoot(), '.claude', 'agents', role + '.md')
    })
  }
  u.fail('Unsupported --platform: ' + platform)
}

function roleChoices (platform) {
  return platform === 'codex' ? ['project'] : ['temporary', 'project']
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
  u.requireCurrentProtocol(state)
  const mode = args.mode || 'auto'
  const projectFiles = projectRoleFiles(platform)
  let roleDir = ''
  let roleMode = ''
  let status = 'ready'

  if (mode === 'auto') {
    if (allExist(projectFiles)) {
      const staleRoles = staleProjectRoles(platform, projectFiles)
      if (staleRoles.length) {
        status = 'stale_roles'
      } else {
        roleMode = 'project'
        roleDir = path.dirname(projectFiles[0])
      }
    } else {
      status = 'needs_choice'
    }
  } else if (mode === 'temporary') {
    if (platform === 'codex') {
      u.fail('Codex does not discover temporary roles; use --mode project')
    }
    roleMode = 'temporary'
    roleDir = writeTemporaryRoles(taskId, platform)
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
    choices: status === 'needs_choice' || status === 'stale_roles' ? roleChoices(platform) : [],
    staleRoles: status === 'stale_roles' ? staleProjectRoles(platform, projectFiles) : []
  }, null, 2) + '\n')
}

try {
  main()
} catch (err) {
  console.error(err.message)
  process.exit(err.exitCode || 1)
}
