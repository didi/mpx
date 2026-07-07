/* eslint-disable @typescript-eslint/no-var-requires */
import React from 'react'
import { render, screen } from '@testing-library/react-native'
import { Text } from 'react-native'
import { resetMpxRuntimeGlobals } from './rn-component-test-utils'

const MpxSwiperItem = require('../../../lib/runtime/components/react/mpx-swiper-item').default
const { SwiperContext } = require('../../../lib/runtime/components/react/context')

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
        <MpxSwiperItem item-id="direct" itemIndex={1} customStyle={{ marginTop: 4 }} enable-var={false}>
          <Text>direct item</Text>
        </MpxSwiperItem>
      </SwiperContext.Provider>
    )
    expect(screen.getByText('direct item')).toBeTruthy()
  })
})
