/* eslint-disable @typescript-eslint/no-var-requires */
import React from 'react'
import { act, fireEvent, screen } from '@testing-library/react-native'
import { expectPortalHostRendered, renderWithPortalHost, getWebViews, resetMpxRuntimeGlobals } from './rn-component-test-utils'

jest.mock('react-native-webview', () => {
  const mockReact = require('react')
  const MockWebView = mockReact.forwardRef((props: any, ref: any) => {
    mockReact.useImperativeHandle(ref, () => ({
      goBack: jest.fn(),
      injectJavaScript: jest.fn(),
      postMessage: jest.fn(),
      reload: jest.fn()
    }))
    return mockReact.createElement('WebView', Object.assign({ testID: props.testID || 'mock-webview' }, props))
  })
  return {
    __esModule: true,
    WebView: MockWebView,
    default: MockWebView
  }
})

const MpxRichText = require('../../../../lib/runtime/components/react/mpx-rich-text').default
const { generateHTML } = require('../../../../lib/runtime/components/react/mpx-rich-text/html')

beforeEach(() => {
  jest.clearAllMocks()
  resetMpxRuntimeGlobals()
})

describe('MpxRichText', () => {
  it('renders html and updates measured height', () => {
    const richTextRender = renderWithPortalHost(
      <MpxRichText
        testID="rich-text"
        style={{ position: 'fixed', width: 200 }}
        nodes={[
          {
            type: 'node',
            name: 'p',
            attrs: { class: 'intro' },
            text: '',
            children: [{ type: 'text', text: 'Hello rich text' }]
          }
        ] as any}
      />
    )

    const webView = getWebViews()[0]
    expect(webView.props.source.html).toContain('<p class="intro">Hello rich text</p>')
    expectPortalHostRendered(richTextRender.toJSON(), 'rich-text')
    act(() => {
      fireEvent(webView, 'message', { nativeEvent: { data: '88' } })
    })
    expect(screen.getByTestId('rich-text').props.style.height).toBe(88)
    expect(generateHTML('<span>x</span>')).toContain('<div id="rich-text"><span>x</span></div>')
  })

  it('renders string nodes inline and defaults missing node attributes and children', () => {
    const stringRender = renderWithPortalHost(
      <MpxRichText testID="string-rich-text" nodes="<strong>raw html</strong>" />
    )
    expect(getWebViews()[0].props.source.html).toContain('<strong>raw html</strong>')
    expect(screen.getByTestId('string-rich-text')).toBeTruthy()
    stringRender.unmount()

    renderWithPortalHost(
      <MpxRichText
        testID="empty-node-rich-text"
        nodes={[{ type: 'node', name: 'br', text: '' }] as any}
      />
    )
    expect(getWebViews()[0].props.source.html).toContain('<br></br>')
  })
})
