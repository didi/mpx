const fs = require('fs')
const Module = require('module')
const path = require('path')
const ts = require('typescript')

function createRuntimeMocks () {
  const reactMock = {
      forwardRef: (render) => render,
      useRef: (value) => ({ current: value }),
      useMemo: (factory) => factory(),
      createElement: function (type, props) {
        return {
          type,
          props: props || {},
          children: Array.prototype.slice.call(arguments, 2)
        }
      },
      useImperativeHandle: () => {},
      useEffect: (effect) => effect()
  }

  const reactNativeMock = {
    SectionList: 'SectionList',
    RefreshControl: 'RefreshControl'
  }

  const nativeGesture = {
    withRef: jest.fn(() => nativeGesture),
    simultaneousWithExternalGesture: jest.fn(() => nativeGesture),
    requireExternalGestureToFail: jest.fn(() => nativeGesture)
  }
  const gestureHandlerMock = {
    Gesture: {
      Native: jest.fn(() => nativeGesture)
    },
    GestureDetector: 'GestureDetector'
  }

  const mpxUtilsMock = {
    error: jest.fn(),
    hasOwn: (target, key) => Object.prototype.hasOwnProperty.call(target, key)
  }

  const getInnerListenersMock = {
    __esModule: true,
    default: (props) => props,
    getCustomEvent: (type, oe, options) => {
      return Object.assign({}, oe, {
        type,
        detail: options.detail || {}
      })
    }
  }

  const utilsMock = {
    extendObject: function (target) {
      for (let i = 1; i < arguments.length; i++) {
        if (arguments[i]) Object.assign(target, arguments[i])
      }
      return target
    },
    useLayout: () => {
      return {
        layoutRef: { current: {} },
        layoutStyle: {},
        layoutProps: {}
      }
    },
    useTransformStyle: () => {
      return {
        hasSelfPercent: false,
        setWidth: jest.fn(),
        setHeight: jest.fn()
      }
    },
    flatGesture: (gesture) => gesture
  }

  return {
    react: reactMock,
    'react-native': reactNativeMock,
    'react-native-gesture-handler': gestureHandlerMock,
    '@mpxjs/utils': mpxUtilsMock,
    './getInnerListeners': getInnerListenersMock,
    './utils': utilsMock
  }
}

function loadSectionList (mocks) {
  const filename = path.resolve(__dirname, '../../lib/runtime/components/react/mpx-section-list.tsx')
  const source = fs.readFileSync(filename, 'utf8')
  const { outputText } = ts.transpileModule(source, {
    fileName: filename,
    compilerOptions: {
      esModuleInterop: true,
      jsx: ts.JsxEmit.Preserve,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2019
    }
  })
  const testModule = new Module(filename, module)
  testModule.filename = filename
  testModule.paths = Module._nodeModulePaths(path.dirname(filename))
  const originalRequire = testModule.require.bind(testModule)
  testModule.require = (request) => {
    return mocks[request] || originalRequire(request)
  }
  testModule._compile(outputText, filename)
  return testModule.exports.default
}

function getSectionListProps (props) {
  const SectionList = loadSectionList(createRuntimeMocks())
  const tree = SectionList(props)
  return tree.children[0].props
}

describe('mpx-section-list item exposure', () => {
  it('reports section-list layout offset for exposed header, item and footer', () => {
    const binditemexposure = jest.fn()
    const header = { isSectionHeader: true, title: 'section 1' }
    const itemA = { id: 1, title: 'item 1' }
    const itemB = { id: 2, title: 'item 2' }
    const footer = { isSectionFooter: true, title: 'footer 1' }
    const sectionListProps = getSectionListProps({
      'enable-item-exposure': true,
      'item-exposure-threshold': 50,
      'list-data': [header, itemA, itemB, footer],
      'use-list-header': true,
      'list-header-height': 20,
      'section-header-height': {
        value: 10
      },
      'item-height': {
        value: 30
      },
      'section-footer-height': {
        value: 40
      },
      binditemexposure
    })
    const section = sectionListProps.sections[0]

    sectionListProps.viewabilityConfigCallbackPairs[0].onViewableItemsChanged({
      changed: [
        { item: section, key: 'header', index: 0, isViewable: true },
        { item: itemB, key: 'itemB', index: 2, isViewable: true },
        { item: section, key: 'footer', index: 3, isViewable: true }
      ]
    })

    expect(binditemexposure).toHaveBeenCalledWith(expect.objectContaining({
      type: 'itemexposure',
      detail: {
        items: [
          {
            index: 0,
            itemData: header,
            layout: {
              offset: 20,
              length: 10
            },
            threshold: 50
          },
          {
            index: 2,
            itemData: itemB,
            layout: {
              offset: 60,
              length: 30
            },
            threshold: 50
          },
          {
            index: 3,
            itemData: footer,
            layout: {
              offset: 90,
              length: 40
            },
            threshold: 50
          }
        ],
        time: expect.any(Number)
      }
    }))
  })

  it('keeps exposure item when section extra data is missing', () => {
    const binditemexposure = jest.fn()
    const header = { isSectionHeader: true, title: 'section 1' }
    const item = { id: 1, title: 'item 1' }
    const footer = { isSectionFooter: true, title: 'footer 1' }
    const sectionListProps = getSectionListProps({
      'enable-item-exposure': true,
      'list-data': [header, item, footer],
      'section-header-height': {
        value: 10
      },
      'item-height': {
        value: 30
      },
      'section-footer-height': {
        value: 40
      },
      binditemexposure
    })
    const section = sectionListProps.sections[0]

    sectionListProps.viewabilityConfigCallbackPairs[0].onViewableItemsChanged({
      changed: [
        { item: Object.assign({}, section, { headerData: null }), key: 'header', index: 0, isViewable: true },
        { item: Object.assign({}, section, { footerData: null }), key: 'footer', index: 2, isViewable: true }
      ]
    })

    expect(binditemexposure).toHaveBeenCalledWith(expect.objectContaining({
      detail: {
        items: [
          {
            index: 0,
            itemData: null,
            layout: {
              offset: 0,
              length: 10
            },
            threshold: 0
          },
          {
            index: 2,
            itemData: null,
            layout: {
              offset: 40,
              length: 40
            },
            threshold: 0
          }
        ],
        time: expect.any(Number)
      }
    }))
  })
})
