import React from 'react'
import { act, create } from 'react-test-renderer'
import MpxCamera from '../../../lib/runtime/components/react/mpx-camera'
import { RouteContext } from '../../../lib/runtime/components/react/context'
import { reactive } from '../../../../core/src/observer/reactive'

jest.mock('react-native-vision-camera', () => ({
  Camera: 'Camera',
  useCameraDevice: () => ({ maxZoom: 1 }),
  useCameraFormat: () => ({}),
  useCodeScanner: () => ({})
}))

jest.mock('@mpxjs/core', () => ({
  watch: jest.requireActual('../../../../core/src/observer/watch').watch
}))

jest.mock('../../../lib/runtime/components/react/utils', () => ({
  extendObject: Object.assign,
  useTransformStyle: () => ({ normalStyle: {} }),
  useLayout: () => ({ layoutRef: { current: null }, layoutStyle: {}, layoutProps: {} })
}))

jest.mock('../../../lib/runtime/components/react/getInnerListeners', () => ({
  __esModule: true,
  default: (props: any) => props,
  getCustomEvent: jest.fn()
}))

describe('camera page identity', () => {
  it('uses the context page status without a page instance id', () => {
    global.__mpxPageStatusMap = reactive({ 1: 'show', 2: 'show' })
    const navigation = {}
    let renderer: any
    act(() => {
      renderer = create(React.createElement(RouteContext.Provider, { value: { navigation, pageId: 1 } },
        React.createElement(MpxCamera)))
    })
    expect(renderer.root.findByType('Camera').props.isActive).toBe(true)
    act(() => { global.__mpxPageStatusMap[1] = 'hide' })
    expect(renderer.root.findByType('Camera').props.isActive).toBe(false)
    act(() => { global.__mpxPageStatusMap[2] = 'hide' })
    act(() => { global.__mpxPageStatusMap[2] = 'show' })
    expect(renderer.root.findByType('Camera').props.isActive).toBe(false)
    act(() => { global.__mpxPageStatusMap[1] = 'show' })
    expect(renderer.root.findByType('Camera').props.isActive).toBe(true)
    act(() => renderer.unmount())
    expect(navigation).not.toHaveProperty('camera')
    delete global.__mpxPageStatusMap
  })
})
