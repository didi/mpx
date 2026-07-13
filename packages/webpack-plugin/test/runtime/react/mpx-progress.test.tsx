import React from 'react'
import { render, screen, waitFor } from '@testing-library/react-native'
import { withTiming } from 'react-native-reanimated'
import MpxProgress from '../../../lib/runtime/components/react/mpx-progress'

describe('MpxProgress', () => {
  it('renders core props and active end event', async () => {
    const bindactiveend = jest.fn()

    render(
      <MpxProgress
        testID="basic-progress"
        percent={70}
        stroke-width="10"
        active={true}
        active-mode="forwards"
        duration={1}
        activeColor="#00ff00"
        backgroundColor="#eeeeee"
        bindactiveend={bindactiveend}
      />
    )

    const progress = screen.getByTestId('basic-progress')
    expect(progress.children[0].props.style).toEqual(expect.objectContaining({
      height: 10,
      backgroundColor: '#eeeeee'
    }))
    const progressFills = progress.findAll((node: any) => {
      return Array.isArray(node.props.style) && node.props.style.some((style: any) => style?.backgroundColor === '#00ff00')
    })
    expect(progressFills[0].props.style).toEqual(expect.arrayContaining([
      expect.objectContaining({ backgroundColor: '#00ff00' })
    ]))

    await waitFor(() => {
      expect(bindactiveend).toHaveBeenCalledWith({
        type: 'activeend',
        detail: { percent: 70 }
      })
    })
  })

  it('distinguishes inactive, forwards and backwards progress', async () => {
    const bindactiveend = jest.fn()
    const { rerender } = render(
      <MpxProgress
        testID="inactive-progress"
        percent={20}
        stroke-width="bad"
        active={false}
        bindactiveend={bindactiveend}
      />
    )

    const progress = screen.getByTestId('inactive-progress')
    expect(progress.children[0].props.style).toEqual(expect.objectContaining({
      height: 6
    }))
    expect(bindactiveend).not.toHaveBeenCalled()

    ;(withTiming as jest.Mock).mockClear()
    rerender(
      <MpxProgress
        testID="inactive-progress"
        percent={30}
        active={true}
        active-mode="forwards"
        duration={1}
        bindactiveend={bindactiveend}
      />
    )
    expect(withTiming).toHaveBeenCalledWith(30, expect.objectContaining({
      duration: 10
    }), expect.any(Function))

    ;(withTiming as jest.Mock).mockClear()
    rerender(
      <MpxProgress
        testID="inactive-progress"
        percent={40}
        active={true}
        active-mode="backwards"
        duration={1}
        bindactiveend={bindactiveend}
      />
    )
    expect(withTiming).toHaveBeenCalledWith(40, expect.objectContaining({
      duration: 40
    }), expect.any(Function))

    await waitFor(() => {
      expect(bindactiveend).toHaveBeenCalledWith({
        type: 'activeend',
        detail: { percent: 40 }
      })
    })
  })
})
