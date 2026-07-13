import React from 'react'
import { act, fireEvent, render, screen } from '@testing-library/react-native'
import MpxVideo from '../../../lib/runtime/components/react/mpx-video'

const mockPortal = jest.fn()
const mockVideoSeek = jest.fn()
const mockVideoResume = jest.fn()
const mockVideoPause = jest.fn()
const mockVideoSetFullScreen = jest.fn()

jest.mock('../../../lib/runtime/components/react/mpx-portal', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const mockReact = require('react')
  return ({ children }: { children: any }) => {
    mockPortal(children)
    return mockReact.createElement(mockReact.Fragment, null, children)
  }
})

jest.mock('react-native-video', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const mockReact = require('react')
  const MockVideo = mockReact.forwardRef((props: any, ref: any) => {
    mockReact.useImperativeHandle(ref, () => ({
      seek: mockVideoSeek,
      resume: mockVideoResume,
      pause: mockVideoPause,
      setFullScreen: mockVideoSetFullScreen
    }))
    return mockReact.createElement('Video', props)
  })
  return {
    __esModule: true,
    default: MockVideo,
    DRMType: {
      FAIRPLAY: 'fairplay'
    }
  }
})

describe('MpxVideo', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders props and emits media events', () => {
    const handlers = {
      bindplay: jest.fn(),
      bindpause: jest.fn(),
      bindended: jest.fn(),
      bindtimeupdate: jest.fn(),
      bindfullscreenchange: jest.fn(),
      bindwaiting: jest.fn(),
      binderror: jest.fn(),
      bindloadedmetadata: jest.fn(),
      bindcontrolstoggle: jest.fn(),
      bindseekcomplete: jest.fn()
    }

    render(
      <MpxVideo
        testID="basic-video"
        src="https://example.com/video.mp4"
        autoplay={true}
        loop={true}
        muted={true}
        controls={false}
        poster="https://example.com/poster.png"
        initial-time={3}
        object-fit="fill"
        is-drm={true}
        provision-url="https://example.com/provision"
        certificate-url="https://example.com/cert"
        license-url="https://example.com/license"
        preferred-peak-bit-rate={256}
        enable-auto-rotation={true as any}
        {...handlers}
      />
    )

    const video = screen.getByTestId('basic-video')
    expect(video.props.source).toEqual(expect.objectContaining({
      uri: 'https://example.com/video.mp4',
      drm: expect.objectContaining({
        type: 'fairplay',
        certificateUrl: 'https://example.com/cert',
        licenseServer: 'https://example.com/license'
      })
    }))
    expect(video.props.paused).toBe(false)
    expect(video.props.repeat).toBe(true)
    expect(video.props.muted).toBe(true)
    expect(video.props.controls).toBe(false)
    expect(video.props.poster).toBe('')
    expect(video.props.resizeMode).toBe('stretch')

    fireEvent(video, 'load', {
      naturalSize: { width: 1920, height: 1080 },
      duration: 12
    })
    fireEvent(video, 'progress', { currentTime: 5 })
    fireEvent(video, 'playbackRateChange', { playbackRate: 1 })
    fireEvent(video, 'playbackRateChange', { playbackRate: 0 })
    fireEvent(video, 'end')
    fireEvent(video, 'buffer', { isBuffering: true })
    fireEvent(video, 'seek', { seekTime: 4 })
    fireEvent(video, 'fullscreenPlayerDidPresent')
    fireEvent(video, 'fullscreenPlayerWillDismiss')
    fireEvent(video, 'controlsVisibilityChange', { isVisible: true })
    fireEvent(video, 'error', {
      error: {
        localizedFailureReason: 'bad video'
      }
    })

    expect(handlers.bindloadedmetadata).toHaveBeenCalledWith(expect.objectContaining({
      type: 'loadedmetadata',
      detail: { width: 1920, height: 1080, duration: 12 }
    }))
    expect(handlers.bindtimeupdate).toHaveBeenCalledWith(expect.objectContaining({
      type: 'timeupdate',
      detail: { currentTime: 5, duration: 12 }
    }))
    expect(handlers.bindplay).toHaveBeenCalledWith(expect.objectContaining({ type: 'play' }))
    expect(handlers.bindpause).toHaveBeenCalledWith(expect.objectContaining({ type: 'pause' }))
    expect(handlers.bindended).toHaveBeenCalledWith(expect.objectContaining({ type: 'ended' }))
    expect(handlers.bindwaiting).toHaveBeenCalledWith(expect.objectContaining({ type: 'waiting' }))
    expect(handlers.bindseekcomplete).toHaveBeenCalledWith(expect.objectContaining({
      type: 'seekcomplete',
      detail: { position: 4 }
    }))
    expect(handlers.bindfullscreenchange).toHaveBeenCalledWith(expect.objectContaining({
      type: 'fullscreenchange',
      detail: { fullScreen: 1 }
    }))
    expect(handlers.bindfullscreenchange).toHaveBeenCalledWith(expect.objectContaining({
      type: 'fullscreenchange',
      detail: { fullScreen: 0 }
    }))
    expect(handlers.bindcontrolstoggle).toHaveBeenCalledWith(expect.objectContaining({
      type: 'controlstoggle',
      detail: { show: true }
    }))
    expect(handlers.binderror).toHaveBeenCalledWith(expect.objectContaining({
      type: 'error',
      detail: { errMsg: 'bad video' }
    }))
  })

  it('exposes instance methods and handles source variants', () => {
    const ref = React.createRef<any>()
    const { rerender } = render(
      <MpxVideo
        ref={ref}
        testID="number-video"
        src={123}
        controls={true}
        poster="poster.png"
        style={{ position: 'fixed' }}
      />
    )

    const numberVideo = screen.getByTestId('number-video')
    expect(numberVideo.props.source).toBe(123)
    expect(numberVideo.props.poster).toBe('poster.png')
    expect(mockPortal).toHaveBeenCalled()

    act(() => {
      const instance = ref.current.getNodeInstance().instance.node
      instance.play()
      instance.pause()
      instance.seek(2)
      instance.stop()
      instance.requestFullScreen()
      instance.exitFullScreen()
    })
    expect(mockVideoResume).toHaveBeenCalledTimes(1)
    expect(mockVideoPause).toHaveBeenCalledTimes(2)
    expect(mockVideoSeek).toHaveBeenNthCalledWith(1, 2)
    expect(mockVideoSeek).toHaveBeenNthCalledWith(2, 0)
    expect(mockVideoSetFullScreen).toHaveBeenNthCalledWith(1, true)
    expect(mockVideoSetFullScreen).toHaveBeenNthCalledWith(2, false)

    rerender(
      <MpxVideo
        testID="object-video"
        src={{ uri: 'https://example.com/object.mp4', headers: { token: '1' } } as any}
        object-fit="cover"
      />
    )

    const objectVideo = screen.getByTestId('object-video')
    expect(objectVideo.props.source).toEqual({
      uri: 'https://example.com/object.mp4',
      headers: { token: '1' }
    })
    expect(objectVideo.props.resizeMode).toBe('cover')
  })
})
