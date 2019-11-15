import '@testing-library/jest-dom/extend-expect'

import {
  showModal
} from '../src/api/modal'

function manualPromise (promise, execResolve, execReject) {
  return new Promise((resolve, reject) => {
    promise().then(res => resolve(res)).catch(err => reject(err))
    execResolve && execResolve()
    execReject && execReject()
  })
}

describe('test modal', () => {
  afterAll(() => {
    document.body.lastChild.remove()
  })

  test('should show actionSheet', () => {
    const titleText = 'this is title'
    const contentText = 'this is content'
    const cancelText = 'cancel'
    const cancelColor = '#333333'
    const confirmText = 'fonfirm'
    const confirmColor = '#999999'
    const success = jest.fn()
    const complete = jest.fn()

    jest.useFakeTimers()

    showModal({
      title: titleText,
      content: contentText,
      cancelText,
      cancelColor,
      confirmText,
      confirmColor,
      success,
      complete
    })

    const modal = document.body.lastChild
    const box = modal.lastChild
    const title = box.firstChild
    const content = box.childNodes[1]
    const btns = box.lastChild
    const cancelBtn = btns.firstChild
    const confirmBtn = btns.lastChild

    expect(modal).toHaveAttribute('class', expect.stringContaining('show'))
    expect(modal.childNodes.length).toBe(2)
    expect(box.childNodes.length).toBe(3)
    expect(title).toHaveTextContent(titleText)
    expect(content).toHaveTextContent(contentText)
    expect(btns.childNodes.length).toBe(2)
    expect(cancelBtn).toHaveTextContent(cancelText)
    expect(cancelBtn).toHaveAttribute('class', expect.not.stringContaining('hide'))
    expect(cancelBtn).toHaveStyle(`color: ${cancelColor}`)
    expect(confirmBtn).toHaveTextContent(confirmText)
    expect(confirmBtn).toHaveStyle(`color: ${confirmColor}`)
    confirmBtn.click()
    jest.runAllTimers()
    expect(modal).toHaveAttribute('class', expect.not.stringContaining('show'))
    expect(success.mock.calls.length).toBe(1)
    expect(complete.mock.calls.length).toBe(1)
    expect(success.mock.calls[0][0]).toEqual({
      errMsg: 'showModal:ok',
      cancel: false,
      confirm: true
    })
  })
  test('should exec promise then', () => {
    const execResolve = () => {
      const modal = document.body.lastChild
      const box = modal.lastChild
      const btns = box.lastChild
      const confirmBtn = btns.lastChild
      confirmBtn.click()
    }

    return manualPromise(() => {
      return showModal({
        title: 'promise'
      })
    }, execResolve)
      .then(res => {
        expect(res).toEqual({
          errMsg: 'showModal:ok',
          cancel: false,
          confirm: true
        })
      })
  })
})
