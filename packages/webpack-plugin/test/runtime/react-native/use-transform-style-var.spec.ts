/// <reference types="jest" />

import React from 'react'
import { act, create, ReactTestRenderer } from 'react-test-renderer'
import { VarContext } from '../../../lib/runtime/components/react/context'
import { useTransformStyle, wrapChildren } from '../../../lib/runtime/components/react/utils'

jest.mock('react-native-gesture-handler', () => ({
  Gesture: { Tap: () => ({}), Pan: () => ({}), LongPress: () => ({}) }
}))

jest.mock('react-native-safe-area-context', () => ({
  initialWindowMetrics: { insets: { top: 0, right: 0, bottom: 0, left: 0 } }
}))

const mounted = jest.fn()
const unmounted = jest.fn()
let childContext: Record<string, any>
const Child = () => {
  const [count, setCount] = React.useState(0)
  childContext = React.useContext(VarContext)
  React.useEffect(() => {
    mounted()
    return () => { unmounted() }
  }, [])
  return React.createElement('Child', { count, onPress: () => setCount(count + 1) })
}

interface StyleNodeProps {
  style: Record<string, any>
  enableVar?: boolean | 'use'
}
const child = React.createElement(Child)
const StyleNode = ({ style, enableVar }: StyleNodeProps) => {
  const { hasVarDec, varContext, normalStyle } = useTransformStyle(style, { enableVar })
  const children = wrapChildren(child, { hasVarDec, varContext })
  return React.createElement('StyleNode', { style: normalStyle, hasProvider: children !== child }, children)
}
const render = (props: StyleNodeProps, inherited: Record<string, any> = {}) =>
  React.createElement(VarContext.Provider, { value: inherited }, React.createElement(StyleNode, props))

let renderer: ReactTestRenderer
let error: jest.SpyInstance
beforeEach(() => {
  mounted.mockClear()
  unmounted.mockClear()
  error = jest.spyOn((global as any).__mpx.config, 'errorHandler')
})
afterEach(() => {
  act(() => renderer.unmount())
  jest.restoreAllMocks()
})

const nodeProps = () => renderer.root.findByType('StyleNode').props
const childProps = () => renderer.root.findByType('Child').props
const expectStableChild = () => {
  expect(childProps().count).toBe(1)
  expect(mounted).toHaveBeenCalledTimes(1)
  expect(unmounted).not.toHaveBeenCalled()
}

test.each([
  { enableVar: 'use' as const, style: {} },
  { style: { width: 'var(--width)' } }
])('consumes changing variables without a Provider: %p', initialProps => {
  const inherited = { '--width': 20 }
  act(() => { renderer = create(render(initialProps, inherited)) })
  act(() => childProps().onPress())
  const consumingNode = React.createElement(StyleNode, { style: { width: 'var(--width)' }, enableVar: initialProps.enableVar })
  act(() => { renderer.update(React.createElement(VarContext.Provider, { value: inherited }, consumingNode)) })
  expect(nodeProps().style.width).toBe(20)
  expect(nodeProps().hasProvider).toBe(false)
  const updated = { '--width': 30 }
  // 相同子元素：验证父上下文更新确实由订阅触发。
  act(() => { renderer.update(React.createElement(VarContext.Provider, { value: updated }, consumingNode)) })
  expect(nodeProps().style.width).toBe(30)
  act(() => { renderer.update(render({ style: {} }, updated)) })
  expect(nodeProps().style).toEqual({})
  expect(nodeProps().hasProvider).toBe(false)
  expect(childContext).toBe(updated)
  act(() => { renderer.update(render({ style: { width: 'var(--width)' } }, updated)) })
  expect(nodeProps().style.width).toBe(30)
  expectStableChild()
  expect(error).not.toHaveBeenCalled()
})

test.each([
  { enableVar: true, style: {} },
  { style: { '--width': 100 } },
  { enableVar: 'use' as const, style: { '--width': 100 } }
])('keeps a Provider and child state across declaration changes: %p', initialProps => {
  act(() => { renderer = create(render(initialProps, { '--width': 20 })) })
  expect(nodeProps().hasProvider).toBe(true)
  act(() => childProps().onPress())
  act(() => { renderer.update(render({ style: { '--width': 100, '--local': 44, width: 'var(--width)' } })) })
  expect(childContext).toEqual({ '--width': 100, '--local': 44 })
  expect(nodeProps().style.width).toBe(100)
  const inherited = { '--width': 20 }
  act(() => { renderer.update(render({ style: {} }, inherited)) })
  expect(nodeProps().hasProvider).toBe(true)
  expect(childContext).toBe(inherited)
  const updated = { '--width': 30 }
  act(() => { renderer.update(render({ style: { width: 'var(--width)' } }, updated)) })
  expect(childContext).toBe(updated)
  expect(nodeProps().style.width).toBe(30)
  act(() => { renderer.update(render({ style: {} })) })
  expect(childContext).toEqual({})
  act(() => { renderer.update(render({ style: { '--width': 80 } })) })
  expect(childContext).toEqual({ '--width': 80 })
  expectStableChild()
  expect(error).not.toHaveBeenCalled()
})

test.each([
  { style: {} },
  { enableVar: 'use' as const, style: {} },
  { style: { width: 'var(--width)' } }
])('rejects late declarations without changing the subtree: %p', initialProps => {
  const inherited = { '--width': 20 }
  act(() => { renderer = create(render(initialProps, inherited)) })
  act(() => childProps().onPress())
  act(() => { renderer.update(render({ style: { '--width': 100, width: 'var(--width)' } }, inherited)) })
  expect(nodeProps().hasProvider).toBe(false)
  expect(childContext).toBe(inherited)
  expect(nodeProps().style.width).toBe(initialProps.enableVar || initialProps.style.width ? 20 : undefined)
  expect(error).toHaveBeenCalledTimes(1)
  expect(error.mock.calls[0][0]).toContain('css variable declaration')
  expectStableChild()
})

test('rejects late subscriptions and drops unresolved var() values', () => {
  act(() => { renderer = create(render({ style: {} })) })
  act(() => childProps().onPress())
  act(() => { renderer.update(render({ style: { width: 'var(--width)' } }, { '--width': 20 })) })
  expect(nodeProps().style).toEqual({})
  expect(nodeProps().hasProvider).toBe(false)
  expect(error).toHaveBeenCalledTimes(1)
  expect(error.mock.calls[0][0]).toContain('css variable use')
  expectStableChild()
})
