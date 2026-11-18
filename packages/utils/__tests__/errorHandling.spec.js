it.each([
  ['errorHandler', 'development'],
  ['errorHandler', 'production'],
  ['warnHandler', 'development'],
  ['warnHandler', 'production']
])('reports a throwing %s in %s without calling it again', (handlerName, env) => {
  const previousEnv = process.env.NODE_ENV
  const previousMpxGlobal = global.mpxGlobal
  const originalError = new Error('original error')
  const handlerError = env === 'development' ? new Error(`${handlerName} failed`) : 0
  const handler = jest.fn(() => { throw handlerError })
  const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {})
  process.env.NODE_ENV = env
  global.mpxGlobal = { __mpx: { config: { [handlerName]: handler } } }

  try {
    jest.isolateModules(() => {
      const { error, warn } = require('../src/log')
      const report = handlerName === 'errorHandler' ? error : warn
      expect(() => report('test message', 'test location', originalError)).not.toThrow()
      expect(handler).toHaveBeenCalledTimes(1)
      expect(handler).toHaveBeenCalledWith('test message', 'test location', originalError)
      expect(consoleError).toHaveBeenCalledWith(handlerError)
    })
  } finally {
    process.env.NODE_ENV = previousEnv
    global.mpxGlobal = previousMpxGlobal
    consoleError.mockRestore()
  }
})
