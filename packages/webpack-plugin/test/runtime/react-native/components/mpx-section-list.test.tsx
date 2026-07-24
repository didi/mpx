/* eslint-disable @typescript-eslint/no-var-requires */
import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react-native'
import { Text } from 'react-native'
import { expectPortalHostRendered, renderWithPortalHost, resetMpxRuntimeGlobals } from './rn-component-test-utils'

const MpxSectionList = require('../../../../lib/runtime/components/react/mpx-section-list').default
const { __getLastSectionListRef } = require('react-native')
const { __getLastNativeGesture } = require('react-native-gesture-handler')

const getSectionList = () => screen.UNSAFE_getByType('SectionList')

beforeEach(() => {
  jest.clearAllMocks()
  resetMpxRuntimeGlobals()
  ;(global as any).__mpxGenericsMap = undefined
})

describe('MpxSectionList', () => {
  it('converts flat list data into sections and calculates layouts from original indexes', () => {
    const itemHeightGetter = jest.fn((item, index) => index + 10)
    const headerHeightGetter = jest.fn((item, index) => index + 20)
    const footerHeightGetter = jest.fn((item, index) => index + 30)
    const listData = [
      { id: 'leading' },
      { id: 'header', isSectionHeader: true },
      { id: 'inside' },
      { id: 'footer', isSectionFooter: true },
      { id: 'trailing' }
    ]

    const { rerender } = render(
      <MpxSectionList
        testID="section-list"
        list-data={listData}
        item-height={{ getter: itemHeightGetter }}
        section-header-height={{ getter: headerHeightGetter }}
        section-footer-height={{ getter: footerHeightGetter }}
        use-list-header={true}
        list-header-height={5}
      />
    )

    let sectionList = getSectionList()
    expect(sectionList.props.sections).toEqual([
      {
        headerData: null,
        footerData: null,
        data: [listData[0]],
        hasSectionHeader: false,
        hasSectionFooter: false
      },
      {
        headerData: listData[1],
        footerData: listData[3],
        data: [listData[2]],
        hasSectionHeader: true,
        hasSectionFooter: true
      },
      {
        headerData: null,
        footerData: null,
        data: [listData[4]],
        hasSectionHeader: false,
        hasSectionFooter: false
      }
    ])
    expect(Array.from({ length: 9 }, (_, index) => sectionList.props.getItemLayout(null, index))).toEqual([
      { length: 0, offset: 5, index: 0 },
      { length: 10, offset: 5, index: 1 },
      { length: 0, offset: 15, index: 2 },
      { length: 21, offset: 15, index: 3 },
      { length: 12, offset: 36, index: 4 },
      { length: 33, offset: 48, index: 5 },
      { length: 0, offset: 81, index: 6 },
      { length: 14, offset: 81, index: 7 },
      { length: 0, offset: 95, index: 8 }
    ])
    expect(itemHeightGetter.mock.calls).toEqual([
      [listData[0], 0],
      [listData[2], 2],
      [listData[4], 4]
    ])
    expect(headerHeightGetter).toHaveBeenCalledWith(listData[1], 1)
    expect(footerHeightGetter).toHaveBeenCalledWith(listData[3], 3)

    const firstHeader = { id: 'first-header', isSectionHeader: true }
    const secondHeader = { id: 'second-header', isSectionHeader: true }
    const footer = { id: 'footer-only', isSectionFooter: true }
    rerender(
      <MpxSectionList
        testID="section-list"
        list-data={[firstHeader, secondHeader, footer]}
        item-height={{ value: 10 }}
        section-header-height={{ value: 20 }}
        section-footer-height={{ value: 30 }}
      />
    )
    sectionList = getSectionList()
    expect(sectionList.props.sections).toEqual([
      expect.objectContaining({ headerData: firstHeader, data: [] }),
      expect.objectContaining({ headerData: secondHeader, footerData: footer, data: [] })
    ])

    rerender(
      <MpxSectionList
        testID="section-list"
        list-data={[footer]}
        item-height={{ value: 10 }}
        section-header-height={{ value: 20 }}
        section-footer-height={{ value: 30 }}
      />
    )
    expect(getSectionList().props.sections).toEqual([
      expect.objectContaining({ headerData: null, footerData: footer, data: [] })
    ])
  })

  it('renders configured generic items, section extras and list extras', () => {
    const Item = ({ itemData }: any) => <Text>{`item:${itemData.id}`}</Text>
    const SectionHeader = ({ itemData }: any) => <Text>{`header:${itemData.id}`}</Text>
    const SectionFooter = ({ itemData }: any) => <Text>{`footer:${itemData.id}`}</Text>
    const ListHeader = ({ listHeaderData }: any) => <Text>{`list-header:${listHeaderData}`}</Text>
    const ListFooter = ({ listFooterData }: any) => <Text>{`list-footer:${listFooterData}`}</Text>
    ;(global as any).__mpxGenericsMap = {
      section: {
        item: () => Item,
        sectionHeader: () => SectionHeader,
        sectionFooter: () => SectionFooter,
        listHeader: () => ListHeader,
        listFooter: () => ListFooter
      }
    }
    const header = { id: 'h', isSectionHeader: true }
    const item = { id: 'i' }
    const footer = { id: 'f', isSectionFooter: true }

    render(
      <MpxSectionList
        generichash="section"
        genericrecycle-item="item"
        genericsection-header="sectionHeader"
        genericsection-footer="sectionFooter"
        genericlist-header="listHeader"
        genericlist-footer="listFooter"
        use-list-header={true}
        use-list-footer={true}
        list-header-data="top"
        list-footer-data="bottom"
        list-data={[header, item, footer]}
      />
    )

    const props = getSectionList().props
    expect(props.renderItem({ item })).toEqual(expect.objectContaining({
      type: Item,
      props: { itemData: item }
    }))
    expect(props.renderSectionHeader({ section: props.sections[0] })).toEqual(expect.objectContaining({
      type: SectionHeader,
      props: { itemData: header }
    }))
    expect(props.renderSectionFooter({ section: props.sections[0] })).toEqual(expect.objectContaining({
      type: SectionFooter,
      props: { itemData: footer }
    }))
    expect(props.renderSectionHeader({ section: { hasSectionHeader: false } })).toBeNull()
    expect(props.renderSectionFooter({ section: { hasSectionFooter: false } })).toBeNull()
    expect(props.ListHeaderComponent).toEqual(expect.objectContaining({
      type: ListHeader,
      props: { listHeaderData: 'top' }
    }))
    expect(props.ListFooterComponent).toEqual(expect.objectContaining({
      type: ListFooter,
      props: { listFooterData: 'bottom' }
    }))
  })

  it('omits renderers when generics or list extras are unavailable', () => {
    const { rerender } = render(
      <MpxSectionList
        generichash="missing"
        genericrecycle-item="item"
        genericsection-header="header"
        genericsection-footer="footer"
        genericlist-header="listHeader"
        genericlist-footer="listFooter"
        use-list-header={true}
        use-list-footer={true}
      />
    )

    let props = getSectionList().props
    expect(props.sections).toEqual([])
    expect(props.renderItem).toBeUndefined()
    expect(props.renderSectionHeader).toBeUndefined()
    expect(props.renderSectionFooter).toBeUndefined()
    expect(props.ListHeaderComponent).toBeNull()
    expect(props.ListFooterComponent).toBeNull()

    ;(global as any).__mpxGenericsMap = { section: {} }
    rerender(
      <MpxSectionList
        generichash="section"
        genericlist-header="listHeader"
        genericlist-footer="listFooter"
        use-list-header={true}
        use-list-footer={true}
      />
    )
    props = getSectionList().props
    expect(props.ListHeaderComponent).toBeNull()
    expect(props.ListFooterComponent).toBeNull()
  })

  it('emits scroll, lower and refresh events with native state', () => {
    const bindscroll = jest.fn()
    const bindscrolltolower = jest.fn()
    const bindrefresherrefresh = jest.fn()
    const { rerender } = render(
      <MpxSectionList
        id="events"
        testID="section-list"
        bindscroll={bindscroll}
        bindscrolltolower={bindscrolltolower}
        bindrefresherrefresh={bindrefresherrefresh}
        refresher-enabled={true}
        refresher-triggered={true}
      />
    )

    const sectionList = getSectionList()
    fireEvent.scroll(sectionList, {
      nativeEvent: { contentOffset: { x: 5, y: 42 } }
    })
    fireEvent(sectionList, 'endReached')
    sectionList.props.refreshControl.props.onRefresh()

    expect(bindscroll).toHaveBeenCalledWith(expect.objectContaining({
      type: 'scroll',
      detail: { scrollTop: 42 }
    }))
    expect(bindscrolltolower).toHaveBeenCalledWith(expect.objectContaining({ type: 'scrolltolower' }))
    expect(bindrefresherrefresh).toHaveBeenCalledWith(expect.objectContaining({ type: 'refresherrefresh' }))
    expect(sectionList.props.refreshControl.props.refreshing).toBe(true)

    rerender(<MpxSectionList testID="section-list" />)
    const sectionListWithoutListeners = getSectionList()
    expect(() => {
      fireEvent.scroll(sectionListWithoutListeners, {
        nativeEvent: { contentOffset: { x: 0, y: 0 } }
      })
      fireEvent(sectionListWithoutListeners, 'endReached')
    }).not.toThrow()
    expect(sectionListWithoutListeners.props.refreshControl).toBeUndefined()
  })

  it('forwards scrolling options and scrolls raw indexes to mapped locations', () => {
    const ref = React.createRef<any>()
    const leading = { id: 'leading' }
    const header = { id: 'header', isSectionHeader: true }
    const item = { id: 'item' }
    const footer = { id: 'footer', isSectionFooter: true }
    const trailing = { id: 'trailing' }
    render(
      <MpxSectionList
        ref={ref}
        testID="section-list"
        enhanced={true}
        bounces={true}
        scroll-event-throttle={16}
        show-scrollbar={false}
        enable-sticky={true}
        enable-back-to-top={true}
        end-reached-threshold={0.25}
        height={300}
        width={200}
        style={{ flex: 1 }}
        list-data={[leading, header, item, footer, trailing]}
      />
    )

    const sectionList = getSectionList()
    expect(sectionList.props).toEqual(expect.objectContaining({
      bounces: true,
      scrollEventThrottle: 16,
      showsVerticalScrollIndicator: false,
      stickySectionHeadersEnabled: true,
      scrollsToTop: true,
      onEndReachedThreshold: 0.25
    }))
    expect(sectionList.props.style).toEqual([
      null,
      { height: 300, width: 200 },
      { flex: 1 },
      undefined
    ])
    expect(__getLastNativeGesture().withRef).toHaveBeenCalledWith(ref.current.gestureRef)

    const sectionListRef = __getLastSectionListRef()
    ref.current.scrollToIndex({ index: 0, animated: true, viewOffset: 8, viewPosition: 0.5 })
    ref.current.scrollToIndex({ index: 1 })
    ref.current.scrollToIndex({ index: 2 })
    ref.current.scrollToIndex({ index: 3 })
    ref.current.scrollToIndex({ index: 4 })
    ref.current.scrollToIndex({ index: 99 })
    expect(sectionListRef.scrollToLocation.mock.calls).toEqual([
      [{ itemIndex: 1, sectionIndex: 0, animated: true, viewOffset: 8, viewPosition: 0.5 }],
      [{ itemIndex: 0, sectionIndex: 1, animated: undefined, viewOffset: 0, viewPosition: 0 }],
      [{ itemIndex: 1, sectionIndex: 1, animated: undefined, viewOffset: 0, viewPosition: 0 }],
      [{ itemIndex: 2, sectionIndex: 1, animated: undefined, viewOffset: 0, viewPosition: 0 }],
      [{ itemIndex: 1, sectionIndex: 2, animated: undefined, viewOffset: 0, viewPosition: 0 }]
    ])
  })

  it('connects simultaneous and wait-for gestures only when provided', () => {
    const simultaneousHandler = { current: {} }
    const waitForHandler = { handlerTag: 1 }
    const { rerender } = render(<MpxSectionList />)

    let gesture = __getLastNativeGesture()
    expect(gesture.simultaneousWithExternalGesture).not.toHaveBeenCalled()
    expect(gesture.requireExternalGestureToFail).not.toHaveBeenCalled()

    rerender(
      <MpxSectionList
        simultaneous-handlers={[simultaneousHandler]}
        wait-for={[waitForHandler]}
      />
    )
    gesture = __getLastNativeGesture()
    expect(gesture.simultaneousWithExternalGesture).toHaveBeenCalledWith(simultaneousHandler)
    expect(gesture.requireExternalGestureToFail).toHaveBeenCalledWith(waitForHandler)
  })

  it('renders fixed lists through the portal and applies default scrolling behavior', () => {
    const sectionListRender = renderWithPortalHost(
      <MpxSectionList testID="fixed-list" style={{ position: 'fixed' }} />
    )

    const sectionList = getSectionList()
    expectPortalHostRendered(sectionListRender.toJSON(), 'fixed-list')
    expect(sectionList.props).toEqual(expect.objectContaining({
      bounces: false,
      scrollEventThrottle: 0,
      showsVerticalScrollIndicator: true,
      stickySectionHeadersEnabled: false,
      scrollsToTop: false,
      onEndReachedThreshold: 0.1
    }))
    expect(sectionList.props.style[0]).toEqual({ flexGrow: 0 })
  })
})
