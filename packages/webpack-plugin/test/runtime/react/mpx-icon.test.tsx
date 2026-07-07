import React from 'react'
import { render, screen } from '@testing-library/react-native'
import MpxIcon from '../../../lib/runtime/components/react/mpx-icon'
import { renderWithPortalHost } from './rn-component-test-utils'

describe('MpxIcon', () => {
  it('renders core props', () => {
    render(
      <MpxIcon testID="basic-icon" type="success" size={16} color="#123456" />
    )

    const icon = screen.getByTestId('basic-icon')
    expect(icon.props.source).toBe('test-file-stub')
    expect(icon.props.style).toEqual(expect.objectContaining({
      width: 16,
      height: 16,
      tintColor: '#123456'
    }))
  })

  it('renders fixed icon through portal', () => {
    renderWithPortalHost(
      <MpxIcon
        testID="fixed-icon"
        type="info"
        style={{ position: 'fixed' }}
      />
    )

    expect(screen.getByTestId('fixed-icon')).toBeTruthy()
  })
})
