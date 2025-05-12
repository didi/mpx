const { exec, spawn } = require('node:child_process')
const path = require('node:path')

const resolveTestFile = (filename) => {
  return path.resolve(process.cwd(), './test/platform/common', filename + '.js')
}

const testFiles = ['style-strip-condition'].map(resolveTestFile)

function start() {
  /**
   * @type {Set<ChildProcess>}
   */
  const tasks = new Set()
  process.on('exit', () => {
    tasks.forEach((task) => {
      if (task.killed) return
      task.exit(1)
    })
  })

  for (const file of testFiles) {
    const task = spawn('node', [file], {
      stdio: 'inherit'
    })

    tasks.add(task)

    task.on('error', (err) => {
      console.error(err)
      tasks.delete(task)
    })

    function close(code) {
      tasks.delete(task)
    }

    task.on('close', close)
  }
}

start()
