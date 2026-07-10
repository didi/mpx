import React from 'react'
import { act, render, screen } from '@testing-library/react-native'
import MpxButton from '../../../lib/runtime/components/react/mpx-button'
import MpxForm from '../../../lib/runtime/components/react/mpx-form'
import { RouteContext } from '../../../lib/runtime/components/react/context'
import { fireTap } from './helpers'

const mockPortal = jest.fn()

jest.mock('../../../lib/runtime/components/react/mpx-portal', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const mockReact = require('react')
  return ({ children }: { children: any }) => {
    mockPortal(children)
    return mockReact.createElement(mockReact.Fragment, null, children)
  }
})

describe('MpxButton', () => {
  beforeEach(() => {
    mockPortal.mockClear()
  })

  it('handles tap and form actions', () => {
    const bindtap = jest.fn()
    const bindsubmit = jest.fn()
    const bindreset = jest.fn()

    render(
      <MpxForm testID="button-form" bindsubmit={bindsubmit} bindreset={bindreset}>
        <MpxButton
          testID="submit-button"
          type="primary"
          size="mini"
          form-type="submit"
          bindtap={bindtap}
        >
          Submit
        </MpxButton>
        <MpxButton
          testID="reset-button"
          plain={true}
          form-type="reset"
        >
          Reset
        </MpxButton>
        <MpxButton
          testID="disabled-button"
          disabled={true}
          bindtap={bindtap}
        >
          Disabled
        </MpxButton>
      </MpxForm>
    )

    act(() => {
      fireTap(screen.getByTestId('submit-button'))
    })
    expect(bindtap).toHaveBeenCalled()
    expect(bindsubmit).toHaveBeenCalled()

    act(() => {
      fireTap(screen.getByTestId('reset-button'))
    })
    expect(bindreset).toHaveBeenCalled()

    act(() => {
      fireTap(screen.getByTestId('disabled-button'))
    })
    expect(bindtap).toHaveBeenCalledTimes(1)
  })

  it('warns unsupported background style and still renders fixed branch', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined)

    try {
      render(
        <MpxButton
          testID="fixed-button"
          hover-class="none"
          style={{ position: 'fixed', backgroundImage: 'url(https://example.com/bg.png)' }}
        >
          Fixed
        </MpxButton>
      )

      expect(screen.getByTestId('fixed-button')).toBeTruthy()
      expect(mockPortal).toHaveBeenCalled()
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Button does not support background image-related styles!'))
    } finally {
      warnSpy.mockRestore()
    }
  })

  it('renders loading state and removes shorthand defaults', () => {
    render(
      <>
        <MpxButton
          testID="loading-button"
          hover-class="none"
          loading={true}
          style={{ margin: 0, padding: 0 }}
        >
          Loading
        </MpxButton>
        <MpxButton
          testID="loading-alone-button"
          hover-class="none"
          loading={true}
        />
      </>
    )

    const button = screen.getByTestId('loading-button')
    expect(button.props.style).toEqual(expect.objectContaining({
      margin: 0,
      padding: 0
    }))
    expect(button.props.style.marginHorizontal).toBeUndefined()
    expect(button.props.style.paddingHorizontal).toBeUndefined()
    expect(screen.getAllByTestId('loading')).toHaveLength(2)
  })

  it('handles share open type and warning branches', async () => {
    jest.useFakeTimers()
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined)
    const shareHandler = jest.fn()
    const onShareAppMessage = jest.fn(() => ({
      title: 'fallback title',
      promise: new Promise((resolve) => {
        expect(resolve).toBeDefined()
      })
    }))
    const globalAny = global as any
    const originalMpx = globalAny.__mpx
    const originalGetCurrentPages = globalAny.getCurrentPages

    try {
      globalAny.__mpx = {
        config: {
          rnConfig: {
            projectName: 'DemoProject',
            openTypeHandler: {
              onShareAppMessage: shareHandler
            }
          }
        }
      }
      globalAny.getCurrentPages = () => [{
        route: '/pages/index',
        __webViewUrl: 'https://example.com',
        getPageId: () => 1,
        onShareAppMessage
      }]

      render(
        <RouteContext.Provider value={{ pageId: 1 }}>
          <MpxButton testID="share-button" hover-class="none" open-type="share">
            Share
          </MpxButton>
          <MpxButton testID="bad-open-type-button" hover-class="none" open-type={'bad' as any}>
            Bad
          </MpxButton>
          <MpxButton testID="missing-open-type-button" hover-class="none" open-type="getUserInfo">
            Missing
          </MpxButton>
        </RouteContext.Provider>
      )

      act(() => {
        fireTap(screen.getByTestId('share-button'))
        jest.advanceTimersByTime(3000)
      })
      await act(async () => {
        await Promise.resolve()
      })
      expect(onShareAppMessage).toHaveBeenCalledWith(expect.objectContaining({
        from: 'button',
        webViewUrl: 'https://example.com'
      }))
      expect(shareHandler).toHaveBeenCalledWith({
        title: 'fallback title',
        path: '/pages/index'
      })

      act(() => {
        fireTap(screen.getByTestId('bad-open-type-button'))
        fireTap(screen.getByTestId('missing-open-type-button'))
      })
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('open-type not support bad'))
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Unregistered onUserInfo event'))
    } finally {
      globalAny.__mpx = originalMpx
      globalAny.getCurrentPages = originalGetCurrentPages
      warnSpy.mockRestore()
      jest.useRealTimers()
    }
  })

  it('handles getUserInfo success and unsupported open type environment', async () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined)
    const globalAny = global as any
    const originalMpx = globalAny.__mpx
    const bindgetuserinfo = jest.fn()

    try {
      globalAny.__mpx = {
        config: {
          rnConfig: {
            openTypeHandler: {
              onUserInfo: { nickName: 'Mpx' }
            }
          }
        }
      }

      const { rerender } = render(
        <MpxButton
          testID="user-info-button"
          hover-class="none"
          open-type="getUserInfo"
          bindgetuserinfo={bindgetuserinfo}
        >
          User
        </MpxButton>
      )

      act(() => {
        fireTap(screen.getByTestId('user-info-button'))
      })
      await act(async () => {
        await Promise.resolve()
      })
      expect(bindgetuserinfo).toHaveBeenCalledWith({ nickName: 'Mpx' })

      globalAny.__mpx = {
        config: {}
      }
      rerender(
        <MpxButton
          testID="unsupported-env-button"
          hover-class="none"
          open-type="share"
        >
          Unsupported
        </MpxButton>
      )
      act(() => {
        fireTap(screen.getByTestId('unsupported-env-button'))
      })
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Environment not supported'))
    } finally {
      globalAny.__mpx = originalMpx
      warnSpy.mockRestore()
    }
  })

  it('handles share defaults without page share handler and missing current page', () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined)
    const shareHandler = jest.fn()
    const globalAny = global as any
    const originalMpx = globalAny.__mpx
    const originalGetCurrentPages = globalAny.getCurrentPages

    try {
      globalAny.__mpx = {
        config: {
          rnConfig: {
            openTypeHandler: {
              onShareAppMessage: shareHandler
            }
          }
        }
      }
      globalAny.getCurrentPages = () => [{
        getPageId: () => 1
      }]

      const { rerender } = render(
        <RouteContext.Provider value={{ pageId: 1 }}>
          <MpxButton testID="share-default-button" hover-class="none" open-type="share">
            Share default
          </MpxButton>
        </RouteContext.Provider>
      )
      act(() => {
        fireTap(screen.getByTestId('share-default-button'))
      })
      expect(shareHandler).toHaveBeenCalledWith({
        title: 'AwesomeProject',
        path: ''
      })

      globalAny.getCurrentPages = () => []
      rerender(
        <RouteContext.Provider value={{ pageId: 1 }}>
          <MpxButton testID="share-missing-page-button" hover-class="none" open-type="share">
            Missing page
          </MpxButton>
        </RouteContext.Provider>
      )
      act(() => {
        fireTap(screen.getByTestId('share-missing-page-button'))
      })
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Current page not found'))
    } finally {
      globalAny.__mpx = originalMpx
      globalAny.getCurrentPages = originalGetCurrentPages
      warnSpy.mockRestore()
    }
  })
})
