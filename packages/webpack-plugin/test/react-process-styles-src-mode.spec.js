const mockGetClassMap = jest.fn(() => ({}))

jest.mock('../lib/helpers', () => () => ({
  getRequestString: () => '"style-request"'
}))

jest.mock('../lib/react/style-helper', () => ({
  getClassMap: mockGetClassMap
}))

const processStyles = require('../lib/react/processStyles')

describe('React styles srcMode', () => {
  it('uses the block srcMode and otherwise inherits the resource srcMode', (done) => {
    const loaderContext = {
      resourcePath: '/src/test.mpx',
      getMpx: () => ({
        mode: 'ios',
        srcMode: 'wx',
        hasUnoCSS: false
      }),
      importModule: jest.fn()
        .mockResolvedValueOnce('.native { color: red; }')
        .mockResolvedValueOnce('.cross { color: blue; }')
    }

    processStyles([
      { srcMode: 'ios' },
      {}
    ], {
      loaderContext,
      ctorType: 'component',
      autoScope: false,
      moduleId: 'm123'
    }, (err) => {
      try {
        expect(err).toBeNull()
        expect(mockGetClassMap.mock.calls[0][0].styles).toEqual([
          expect.objectContaining({ srcMode: 'ios' }),
          expect.objectContaining({ srcMode: 'wx' })
        ])
        done()
      } catch (e) {
        done(e)
      }
    })
  })
})
