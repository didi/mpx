#!/usr/bin/env node

const { spawn } = require('child_process')
const path = require('path')

const args = process.argv.slice(2)

// Default Jest configuration for React components
const jestArgs = [
  '--config', path.join(__dirname, '..', 'jest.config.json'),
  '--testPathPattern=lib/runtime/components/react',
  '--verbose'
]

// Add coverage if requested
if (args.includes('--coverage')) {
  jestArgs.push('--coverage')
  jestArgs.push('--coverageDirectory=coverage/react-components')
}

// Add watch mode if requested
if (args.includes('--watch')) {
  jestArgs.push('--watch')
}

// Add specific test pattern if provided
const testPattern = args.find(arg => arg.startsWith('--testNamePattern='))
if (testPattern) {
  jestArgs.push(testPattern)
}

// Add specific file pattern if provided
const filePattern = args.find(arg => arg.startsWith('--testPathPattern='))
if (filePattern) {
  jestArgs.push(filePattern)
}

// Add any other Jest arguments
const otherArgs = args.filter(arg => 
  !arg.startsWith('--testNamePattern=') && 
  !arg.startsWith('--testPathPattern=') &&
  arg !== '--coverage' &&
  arg !== '--watch'
)
jestArgs.push(...otherArgs)

console.log('Running React component tests...')
console.log('Jest args:', jestArgs.join(' '))

const jest = spawn('npx', ['jest', ...jestArgs], {
  stdio: 'inherit',
  cwd: path.join(__dirname, '..')
})

jest.on('close', (code) => {
  process.exit(code)
})

jest.on('error', (err) => {
  console.error('Failed to start Jest:', err)
  process.exit(1)
})
