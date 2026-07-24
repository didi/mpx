/* eslint-disable @typescript-eslint/no-var-requires */
import React from 'react'
import { render, screen } from '@testing-library/react-native'

const Portal = require('../../../../lib/runtime/components/react/mpx-portal').default
const { RouteContext } = require('../../../../lib/runtime/components/react/context')

export function resetMpxRuntimeGlobals () {
  const runtimeGlobal = global as any
  runtimeGlobal.__mpx_mode__ = 'ios'
  runtimeGlobal.__mpx = {
    i18n: { locale: 'zh-CN' },
    config: {
      rnConfig: {
        cameraPermission: jest.fn(() => Promise.resolve(true)),
        webviewConfig: {
          hostWhitelists: ['example.com'],
          apiImplementations: {
            customApi: jest.fn(() => ({ ok: true }))
          }
        },
        onPickerVibrate: jest.fn()
      }
    }
  }
  runtimeGlobal.__mpxPageStatusMap = {}
  runtimeGlobal.__mpxAppCbs = {
    lazyLoad: [jest.fn()]
  }
  runtimeGlobal.__mockPage = {
    getPageId: () => 1,
    id: 1,
    __webViewUrl: ''
  }
  runtimeGlobal.getCurrentPages = jest.fn(() => [runtimeGlobal.__mockPage])
  runtimeGlobal.atob = jest.fn((value) => `decoded:${value}`)
  runtimeGlobal.mpxGlobal = runtimeGlobal.mpxGlobal || { __mpx: { config: {} } }
  runtimeGlobal.mpxGlobal.__mpx = runtimeGlobal.mpxGlobal.__mpx || { config: {} }
  runtimeGlobal.mpxGlobal.__mpx.config = runtimeGlobal.mpxGlobal.__mpx.config || {}
  runtimeGlobal.mpxGlobal.__mpx.config.rnConfig = {
    enableNativeKeyboardAvoiding: false,
    onLazyLoadPageError: jest.fn(),
    onStackTopBack: jest.fn(),
    onPickerVibrate: jest.fn()
  }
}

export function renderWithRoute (children: React.ReactNode, navigation: any = {}, pageId = 1) {
  return render(
    <RouteContext.Provider value={{ pageId, navigation }}>
      {children}
    </RouteContext.Provider>
  )
}

export function renderWithPortalHost (children: React.ReactNode, navigation: any = {}, pageId = 1) {
  return renderWithRoute(
    <Portal.Host pageId={pageId}>
      {children}
    </Portal.Host>,
    navigation,
    pageId
  )
}

export function getWebViews () {
  return screen.UNSAFE_getAllByType('WebView')
}

export function getViews () {
  return screen.UNSAFE_getAllByType('View')
}

function hasTestID (tree: any, testID: string): boolean {
  if (!tree) return false
  if (Array.isArray(tree)) {
    return tree.some((node) => hasTestID(node, testID))
  }
  if (tree.props?.testID === testID) return true
  return hasTestID(tree.children, testID)
}

export function expectPortalHostRendered (tree: any, testID: string) {
  expect(Array.isArray(tree)).toBe(true)
  const [host, ...portalChildren] = tree
  expect(hasTestID(host, testID)).toBe(false)
  expect(hasTestID(portalChildren, testID)).toBe(true)
}

export function expectPortalHostInline (tree: any, testID: string) {
  expect(Array.isArray(tree)).toBe(true)
  const [host, ...portalChildren] = tree
  expect(hasTestID(host, testID)).toBe(true)
  expect(hasTestID(portalChildren, testID)).toBe(false)
}
