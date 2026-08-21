/* eslint-disable @typescript-eslint/no-var-requires */
import React from 'react'
import { render, screen } from '@testing-library/react-native'
import { Text } from 'react-native'
import { resetMpxRuntimeGlobals } from './rn-component-test-utils'

const MpxSwiperItem = require('../../../../lib/runtime/components/react/mpx-swiper-item').default
const { SwiperContext } = require('../../../../lib/runtime/components/react/context')

beforeEach(() => {
  jest.clearAllMocks()
  resetMpxRuntimeGlobals()
})

describe('MpxSwiperItem', () => {
  it('renders directly from context with scale style', () => {
    render(
      <SwiperContext.Provider value={{
        offset: { value: 0 },
        step: { value: 100 },
        scale: true,
        dir: 'y'
      }}>
        <MpxSwiperItem testID="direct-item" item-id="direct" itemIndex={1} customStyle={{ marginTop: 4 }} enable-var={false}>
          <Text>direct item</Text>
        </MpxSwiperItem>
      </SwiperContext.Provider>
    )
    const item = screen.getByTestId('direct-item')
    expect(screen.getByText('direct item')).toBeTruthy()
    expect(item.props.style).toContainEqual(expect.objectContaining({
      width: '100%',
      height: 100,
      transform: [{ scale: 0.7 }]
    }))
    expect(item.props.style).toContainEqual(expect.objectContaining({ marginTop: 4 }))
  })

  it('returns empty animated style before swiper step is ready', () => {
    render(
      <SwiperContext.Provider value={{ offset: { value: 0 } }}>
        <MpxSwiperItem testID="default-item" itemIndex={0} customStyle={{}} enable-var={false} />
      </SwiperContext.Provider>
    )

    expect(screen.getByTestId('default-item').props.style).toContainEqual({})
  })

  it('defaults to horizontal layout without scaling', () => {
    render(
      <SwiperContext.Provider value={{ offset: { value: 0 }, step: { value: 100 } }}>
        <MpxSwiperItem testID="default-layout-item" itemIndex={0} customStyle={{}} enable-var={false} />
      </SwiperContext.Provider>
    )

    expect(screen.getByTestId('default-layout-item').props.style).toContainEqual({
      width: 100,
      height: '100%',
      transform: []
    })
  })
})
