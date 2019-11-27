import '@testing-library/jest-dom/extend-expect'
import {
  showActionSheet
} from '../../api-proxy/src/web/api/action-sheet/index'

function manualPromise (promise, execResolve, execReject) {
  return new Promise((resolve, reject) => {
    promise().then(res => resolve(res)).catch(err => reject(err))
    execResolve && execResolve()
    execReject && execReject()
  })
}

describe('test toast', () => {
  afterAll(() => {
    document.body.lastChild.remove()
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
    list.childNodes[2].click()
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
    cancelBtn.click()
    jest.runAllTimers()
    expect(actionSheet).toHaveAttribute('class', expect.not.stringContaining('show'))
    expect(fail.mock.calls.length).toBe(1)
    expect(complete.mock.calls.length).toBe(1)
    expect(fail.mock.calls[0][0]).toEqual({
      errMsg: 'showActionSheet:fail cancel'
    })
  })

  test('should exec promise then', () => {
    const execResolve = () => {
      const actionSheet = document.body.lastChild
      const list = actionSheet.lastChild.firstChild
      list.childNodes[2].click()
    }

    return manualPromise(() => {
      return showActionSheet({
        itemList: ['A', 'B', 'C']
      })
    }, execResolve)
      .then(res => {
        expect(res).toEqual({
          errMsg: 'showActionSheet:ok',
          tapIndex: 2
        })
      })
  })

  test('should exec promise catch', () => {
    const execReject = () => {
      const actionSheet = document.body.lastChild
      const cancelBtn = actionSheet.lastChild.lastChild
      cancelBtn.click()
    }

    return manualPromise(() => {
      return showActionSheet({
        itemList: ['A', 'B', 'C']
      })
    }, null, execReject)
      .catch(err => {
        expect(err).toEqual({
          errMsg: 'showActionSheet:fail cancel'
        })
      })
  })
})
