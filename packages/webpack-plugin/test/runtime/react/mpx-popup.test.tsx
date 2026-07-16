/* eslint-disable @typescript-eslint/no-var-requires */
import React from 'react'
import { fireEvent, render } from '@testing-library/react-native'
import { Text } from 'react-native'
import { withTiming } from 'react-native-reanimated'
import { getViews, resetMpxRuntimeGlobals } from './rn-component-test-utils'

jest.mock('@mpxjs/api-proxy', () => ({
  getWindowInfo: jest.fn(() => ({
    screenHeight: 800,
    safeArea: { bottom: 760 }
  }))
}))

const Portal = require('../../../lib/runtime/components/react/mpx-portal').default
const { createPopupManager } = require('../../../lib/runtime/components/react/mpx-popup')
const PopupBase = require('../../../lib/runtime/components/react/mpx-popup/popupBase').default

beforeEach(() => {
  jest.clearAllMocks()
  resetMpxRuntimeGlobals()
})

describe('MpxPopup', () => {
  it('manages popup lifecycle and PopupBase interactions', () => {
    const addSpy = jest.spyOn(Portal, 'add').mockReturnValue(100)
    const updateSpy = jest.spyOn(Portal, 'update').mockImplementation(() => undefined)
    const removeSpy = jest.spyOn(Portal, 'remove').mockImplementation(() => undefined)
    const manager = createPopupManager()

    manager.open(<Text>popup child</Text>, 1, { contentHeight: 200 })
    manager.show()
    manager.update(<Text>popup updated</Text>)
    manager.hide()
    manager.remove()

    expect(addSpy).toHaveBeenCalledTimes(1)
    expect(addSpy).toHaveBeenCalledWith(expect.anything(), 1)
    const addedPopup = addSpy.mock.calls[0][0] as React.ReactElement<any>
    expect(addedPopup.props).toEqual(expect.objectContaining({
      contentHeight: 200,
      visible: false
    }))
    expect(addedPopup.props.children.props.children).toBe('popup child')

    expect(updateSpy).toHaveBeenCalledTimes(3)
    expect(updateSpy.mock.calls.map(([key]) => key)).toEqual([100, 100, 100])
    const updates = updateSpy.mock.calls.map(([, popup]) => popup as React.ReactElement<any>)
    expect(updates[0].props.visible).toBe(true)
    expect(updates[1].props.visible).toBe(true)
    expect(updates[1].props.children.props.children).toBe('popup updated')
    expect(updates[2].props.visible).toBe(false)
    expect(updates[2].props.children.props.children).toBe('popup updated')
    expect(removeSpy).toHaveBeenCalledWith(100)
    addSpy.mockRestore()
    updateSpy.mockRestore()
    removeSpy.mockRestore()

    const hide = jest.fn()
    render(
      <PopupBase visible={true} hide={hide} contentHeight={120}>
        <Text>popup body</Text>
      </PopupBase>
    )
    const views = getViews()
    fireEvent(views[0], 'touchEnd')
    expect(hide).toHaveBeenCalled()
    const stopPropagation = jest.fn()
    fireEvent(views[1], 'touchEnd', { stopPropagation })
    expect(stopPropagation).toHaveBeenCalled()
  })

  it('ignores invalid manager transitions and supports a custom modal', () => {
    const addSpy = jest.spyOn(Portal, 'add').mockReturnValue(101)
    const updateSpy = jest.spyOn(Portal, 'update').mockImplementation(() => undefined)
    const removeSpy = jest.spyOn(Portal, 'remove').mockImplementation(() => undefined)
    const CustomModal = (props: any) => <Text>{props.children}</Text>
    const manager = createPopupManager({ modal: CustomModal })

    manager.show()
    manager.hide()
    manager.update(<Text>ignored update</Text>)
    manager.remove()
    manager.open(<Text>missing page</Text>, undefined)
    expect(addSpy).not.toHaveBeenCalled()
    expect(updateSpy).not.toHaveBeenCalled()
    expect(removeSpy).not.toHaveBeenCalled()

    manager.open(<Text>custom popup</Text>, 1)
    manager.open(<Text>duplicate popup</Text>, 1)
    manager.update(null)
    expect(updateSpy).not.toHaveBeenCalled()
    expect(addSpy).toHaveBeenCalledTimes(1)
    const addedPopup = addSpy.mock.calls[0][0] as React.ReactElement<any>
    expect(addedPopup.type).toBe(CustomModal)
    expect(addedPopup.props).toEqual(expect.objectContaining({ visible: false }))
    manager.remove()
    manager.remove()
    expect(removeSpy).toHaveBeenCalledTimes(1)
    addSpy.mockRestore()
    updateSpy.mockRestore()
    removeSpy.mockRestore()
  })

  it('runs default PopupBase hide/show animation branches', () => {
    const popupRender = render(<PopupBase />)
    let views = getViews()
    expect(views[0].props.style[2]).toEqual({ pointerEvents: 'none' })
    fireEvent(views[0], 'touchEnd')

    popupRender.rerender(<PopupBase visible={true}><Text>visible</Text></PopupBase>)
    views = getViews()
    expect(views[0].props.style[2]).toEqual({ pointerEvents: 'auto' })
    popupRender.rerender(<PopupBase visible={false}><Text>hidden</Text></PopupBase>)
    expect(getViews()[0].props.style[2]).toEqual({ pointerEvents: 'none' })
    expect((withTiming as jest.Mock).mock.calls.map(([value]) => value)).toEqual([1, 0, 0, 370])
  })

  it('uses PopupBase for picker popup type', () => {
    const addSpy = jest.spyOn(Portal, 'add').mockReturnValue(102)
    const manager = createPopupManager({ type: 'picker' as any })

    manager.open(<Text>picker popup</Text>, 1)

    expect((addSpy.mock.calls[0][0] as React.ReactElement).type).toBe(PopupBase)
    addSpy.mockRestore()
  })
})
