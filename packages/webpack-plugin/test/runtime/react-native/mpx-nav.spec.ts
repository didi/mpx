import React from 'react'
import { act, create } from 'react-test-renderer'
import MpxNav from '../../../lib/runtime/components/react/mpx-nav'

jest.mock('react-native', () => ({
  StatusBar: 'StatusBar',
  TouchableWithoutFeedback: 'TouchableWithoutFeedback',
  Image: 'Image',
  View: 'View',
  Text: 'Text',
  StyleSheet: { create: (styles: any) => styles },
  processColor: (color: string) => color ? parseInt(color.slice(1), 16) : null
}))

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 20 })
}), { virtual: true })

describe('RN built-in navigation bar', () => {
  test('merges consecutive title and color updates in the same batch', () => {
    const navigation: any = { getState: () => ({ routes: [{}] }) }
    let renderer: any
    act(() => {
      renderer = create(React.createElement(MpxNav, {
        pageConfig: { navigationBarTitleText: 'Initial' }, navigation
      }))
    })
    act(() => {
      navigation.setPageConfig({ navigationBarTitleText: 'Updated' })
      navigation.setPageConfig({ navigationBarTextStyle: '#000000', navigationBarBackgroundColor: '#123456' })
    })

    expect(renderer.root.findByType('Text').props.children).toBe('Updated')
    expect(renderer.root.findByType('Text').props.style[1].color).toBe('#000000')
    expect(renderer.root.findAllByType('View')[0].props.style[1].backgroundColor).toBe('#123456')
    expect(renderer.root.findByType('StatusBar').props.barStyle).toBe('dark-content')
    act(() => renderer.unmount())
  })
})
