/* eslint-disable @typescript-eslint/no-var-requires */
import React from 'react'
import { fireEvent, render } from '@testing-library/react-native'
import { Text } from 'react-native'
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

    expect(addSpy).toHaveBeenCalledWith(expect.anything(), 1)
    expect(updateSpy).toHaveBeenCalled()
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
})
