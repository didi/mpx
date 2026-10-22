const { getClassMap } = require('../../../../lib/react/style-helper')

describe('RN responsive media styles', () => {
  const createConfig = () => ({ mode: 'ios', srcMode: 'wx', ctorType: 'component', warn: jest.fn(), error: jest.fn() })
  describe('Media queries', () => {
    test('keeps media declarations out of the default class style', () => {
      const config = createConfig()
      const result = getClassMap({
        content: `
          .media-box {
            width: 280px;
            background-color: red;
          }
          @media (min-width: 600px) {
            .media-box {
              width: 520px;
              background-color: green;
            }
          }
        `,
        filename: 'test.css',
        ...config
      })

      expect(result['media-box']).toEqual({
        width: '280',
        backgroundColor: '"red"',
        _media: [{
          options: { minWidth: 600 },
          value: {
            width: '520',
            backgroundColor: '"green"'
          }
        }]
      })
      expect(config.error).not.toHaveBeenCalled()
    })

    test('keeps important declarations in the media style', () => {
      const config = createConfig()
      const result = getClassMap({
        content: `
          .media-box {
            width: 100px;
          }
          @media (min-width: 300px) {
            .media-box {
              width: 200px !important;
            }
          }
        `,
        filename: 'test.css',
        ...config
      })

      expect(result['media-box']).toEqual({
        width: '100',
        _media: [{
          options: { minWidth: 300 },
          value: {
            _inlineLayer: {
              important: { width: '200' }
            }
          }
        }]
      })
      expect(config.error).not.toHaveBeenCalled()
    })
  })
})
