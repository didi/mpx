/// <reference types="jest" />

import React from 'react'
import { act, create, ReactTestRenderer } from 'react-test-renderer'
import { EnvContext, VarContext } from '../../../lib/runtime/components/react/context'
import { useTransformStyle } from '../../../lib/runtime/components/react/utils'

jest.mock('react-native-gesture-handler', () => ({ Gesture: {} }))

interface StyleProps {
  style?: Record<string, any>
  enableEnv?: boolean
}
const renders = jest.fn()
const StyleNode = React.memo(({ style, enableEnv }: StyleProps) => {
  renders()
  const { normalStyle } = useTransformStyle(style, { enableEnv })
  return React.createElement('StyleNode', { style: normalStyle })
})
let renderer: ReactTestRenderer
let error: jest.SpyInstance
beforeEach(() => {
  renders.mockClear()
  error = jest.spyOn((global as any).__mpx.config, 'errorHandler')
})
afterEach(() => {
  act(() => renderer.unmount())
  jest.restoreAllMocks()
})
const styleProps = () => renderer.root.findByType('StyleNode').props.style
const withEnv = (child: React.ReactElement, insets: Record<string, number>) => React.createElement(EnvContext.Provider, { value: insets }, child)

test('uses an empty default context and env fallback', () => {
  act(() => { renderer = create(React.createElement(StyleNode, { style: { paddingTop: 'env(safe-area-inset-top, 7px)' } })) })
  expect(styleProps().paddingTop).toBe(7)
})

test('updates memoized styles when safearea changes, including zero and calc()', () => {
  const style = {
    paddingTop: 'env(safe-area-inset-top)',
    paddingRight: 'env(safe-area-inset-right)',
    paddingBottom: 'calc(env(safe-area-inset-bottom) + 5px)',
    paddingLeft: 'env(safe-area-inset-left)',
    marginTop: 'env(unknown, 7px)'
  }
  const child = React.createElement(StyleNode, { style })
  act(() => { renderer = create(withEnv(child, { top: 20, right: 0, bottom: 10, left: 0 })) })
  expect(styleProps()).toMatchObject({ paddingTop: 20, paddingRight: 0, paddingBottom: 15, paddingLeft: 0, marginTop: 7 })
  act(() => { renderer.update(withEnv(child, { top: 0, right: 30, bottom: 0, left: 30 })) })
  expect(styleProps()).toMatchObject({ paddingTop: 0, paddingRight: 30, paddingBottom: 5, paddingLeft: 30, marginTop: 7 })
  expect(renders).toHaveBeenCalledTimes(2)
  expect(style.paddingTop).toBe('env(safe-area-inset-top)')
})

test.each([
  {},
  { enableEnv: false },
  { enableEnv: false, style: { paddingTop: 'env(safe-area-inset-top)' } }
])('does not subscribe without opt-in: %p', props => {
  const child = React.createElement(StyleNode, props)
  act(() => { renderer = create(withEnv(child, { top: 20 })) })
  act(() => { renderer.update(withEnv(child, { top: 40 })) })
  expect(renders).toHaveBeenCalledTimes(1)
})

test('explicit true subscribes before env() is used', () => {
  act(() => { renderer = create(withEnv(React.createElement(StyleNode, { enableEnv: true }), { top: 20 })) })
  const child = React.createElement(StyleNode, { enableEnv: true, style: { paddingTop: 'env(safe-area-inset-top)' } })
  act(() => { renderer.update(withEnv(child, { top: 20 })) })
  act(() => { renderer.update(withEnv(child, { top: 40 })) })
  expect(styleProps().paddingTop).toBe(40)
  expect(error).not.toHaveBeenCalled()
})

test('allows inferred env use to disappear and return without changing the subscription', () => {
  act(() => { renderer = create(withEnv(React.createElement(StyleNode, { style: { height: 'env(safe-area-inset-bottom)' } }), { bottom: 20 })) })
  const plain = React.createElement(StyleNode, { style: { height: 12 } })
  act(() => { renderer.update(withEnv(plain, { bottom: 30 })) })
  expect(styleProps().height).toBe(12)
  const count = renders.mock.calls.length
  act(() => { renderer.update(withEnv(plain, { bottom: 40 })) })
  expect(renders).toHaveBeenCalledTimes(count + 1)
  act(() => { renderer.update(withEnv(React.createElement(StyleNode, { style: { height: 'env(safe-area-inset-bottom)' } }), { bottom: 40 })) })
  expect(styleProps().height).toBe(40)
  expect(error).not.toHaveBeenCalled()
})

test.each([
  { height: 'env(safe-area-inset-bottom)', width: 12 },
  { height: 'calc(env(safe-area-inset-bottom) + 5px)', width: 'calc(10px + 2px)' },
  { transform: [{ translateX: 'env(safe-area-inset-bottom)' }, { scale: 2 }], width: 12 },
  { padding: 'env(safe-area-inset-bottom) 4px', width: 12 }
])('drops unsupported env styles before subsequent transforms: %p', style => {
  act(() => { renderer = create(withEnv(React.createElement(StyleNode, { style, enableEnv: false }), { bottom: 20 })) })
  expect(styleProps()).toMatchObject({ width: 12 })
  expect(styleProps()).not.toHaveProperty('height')
  expect(styleProps()).not.toHaveProperty('transform')
  expect(styleProps()).not.toHaveProperty('padding')
  expect(error).not.toHaveBeenCalled()
})

test('reports late env use and drops the invalid style', () => {
  act(() => { renderer = create(withEnv(React.createElement(StyleNode, { style: {} }), { bottom: 20 })) })
  act(() => { renderer.update(withEnv(React.createElement(StyleNode, { style: { height: 'calc(env(safe-area-inset-bottom) + 5px)', width: 12 } }), { bottom: 20 })) })
  expect(styleProps()).toEqual({ width: 12 })
  expect(error).toHaveBeenCalledTimes(1)
  expect(error.mock.calls[0][0]).toContain('[enable-env]')
})

test.each([[false, true], [true, false]])('rejects explicit enable-env changes: %p → %p', (first, next) => {
  act(() => { renderer = create(withEnv(React.createElement(StyleNode, { enableEnv: first }), { bottom: 20 })) })
  act(() => { renderer.update(withEnv(React.createElement(StyleNode, { enableEnv: next }), { bottom: 20 })) })
  expect(error).toHaveBeenCalledTimes(1)
})

test.each([
  { '--inset': 'env(safe-area-inset-top)', paddingTop: 'var(--inset)' },
  { paddingTop: 'var(--missing, env(safe-area-inset-top))' },
  { '--un-inset': 'env(safe-area-inset-top)', paddingTop: 'var(--un-inset)' }
])('subscribes after resolving variables: %p', style => {
  const child = React.createElement(VarContext.Provider, { value: {} }, React.createElement(StyleNode, { style }))
  act(() => { renderer = create(withEnv(child, { top: 20 })) })
  expect(styleProps().paddingTop).toBe(20)
  act(() => { renderer.update(withEnv(child, { top: 40 })) })
  expect(styleProps().paddingTop).toBe(40)
})

test('subscribes to an initially unused env fallback before the parent variable disappears', () => {
  const child = React.createElement(StyleNode, { style: { height: 'var(--height, env(safe-area-inset-bottom))' } })
  const first = React.createElement(VarContext.Provider, { value: { '--height': 12 } }, child)
  act(() => { renderer = create(withEnv(first, { bottom: 20 })) })
  expect(styleProps().height).toBe(12)
  const count = renders.mock.calls.length
  act(() => { renderer.update(withEnv(first, { bottom: 30 })) })
  expect(renders).toHaveBeenCalledTimes(count + 1)
  const fallback = React.createElement(VarContext.Provider, { value: {} }, child)
  act(() => { renderer.update(withEnv(fallback, { bottom: 30 })) })
  expect(styleProps().height).toBe(30)
  act(() => { renderer.update(withEnv(fallback, { bottom: 0 })) })
  expect(styleProps().height).toBe(0)
  expect(error).not.toHaveBeenCalled()
})

test('preserves an env fallback when a local UnoCSS variable disappears', () => {
  act(() => { renderer = create(withEnv(React.createElement(StyleNode, { style: { '--un-height': 12, height: 'var(--un-height, env(safe-area-inset-bottom))' } }), { bottom: 20 })) })
  expect(styleProps().height).toBe(12)
  act(() => { renderer.update(withEnv(React.createElement(StyleNode, { style: { height: 'var(--un-height, env(safe-area-inset-bottom))' } }), { bottom: 30 })) })
  expect(styleProps().height).toBe(30)
  expect(error).not.toHaveBeenCalled()
})
