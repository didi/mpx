import '@testing-library/jest-dom/extend-expect'
import {
  showActionSheet
} from '../../src/platform/api/action-sheet/index.web'
import { dispatchTap } from '../../test/touch'

describe('test toast', () => {
  afterAll(() => {
    document.body.lastChild && document.body.lastChild.remove()
  })
  test('should show actionSheet', () => {
    const A = 'A'
    const B = 'B'
    const C = 'C'

    const success = jest.fn()
    const fail = jest.fn()
    const complete = jest.fn()

    jest.useFakeTimers()

    showActionSheet({
      itemList: [A, B, C],
      success,
      fail,
      complete
    })
    const actionSheet = document.body.lastChild
    const list = actionSheet.lastChild.firstChild

    expect(actionSheet).toHaveAttribute('class', expect.stringContaining('show'))
    expect(actionSheet.childNodes.length).toBe(2)
    expect(list.childNodes.length).toBe(3)
    expect(list.childNodes[0]).toHaveTextContent(A)
    expect(list.childNodes[1]).toHaveTextContent(B)
    expect(list.childNodes[2]).toHaveTextContent(C)
    // 点击第三个
    dispatchTap(list.childNodes[2])
    jest.runAllTimers()
    expect(actionSheet).toHaveAttribute('class', expect.not.stringContaining('show'))
    expect(success.mock.calls.length).toBe(1)
    expect(complete.mock.calls.length).toBe(1)
    expect(success.mock.calls[0][0]).toEqual({
      errMsg: 'showActionSheet:ok',
      tapIndex: 2
    })
  })

  test('should click cancel fail', () => {
    const A = 'A'
    const B = 'B'
    const C = 'C'
    const D = 'D'
    const E = 'E'

    const fail = jest.fn()
    const complete = jest.fn()

    jest.useFakeTimers()

    showActionSheet({
      itemList: [A, B, C, D, E],
      fail,
      complete
    })
    const actionSheet = document.body.lastChild
    const list = actionSheet.lastChild.firstChild
    const cancelBtn = actionSheet.lastChild.lastChild

    expect(actionSheet).toHaveAttribute('class', expect.stringContaining('show'))
    expect(actionSheet.childNodes.length).toBe(2)
    expect(list.childNodes.length).toBe(5)
    dispatchTap(cancelBtn)
    jest.runAllTimers()
    expect(actionSheet).toHaveAttribute('class', expect.not.stringContaining('show'))
    expect(fail.mock.calls.length).toBe(1)
    expect(complete.mock.calls.length).toBe(1)
    expect(fail.mock.calls[0][0]).toEqual({
      errMsg: 'showActionSheet:fail cancel'
    })
  })
})
