# React TSX 组件测试模板

## 基础测试模板

```tsx
import React from 'react'
import renderer from 'react-test-renderer'
import YourComponent from '../your-component'

// Mock 必要的依赖
jest.mock('@mpxjs/utils', () => ({
  error: jest.fn(),
  warn: jest.fn(),
  isFunction: jest.fn((fn) => typeof fn === 'function')
}))

jest.mock('../utils', () => ({
  parseUrl: jest.fn(),
  PERCENT_REGEX: /%$/,
  splitStyle: jest.fn((style) => ({ textStyle: {}, backgroundStyle: {}, innerStyle: style || {} })),
  splitProps: jest.fn((props) => ({ textProps: {}, innerProps: props })),
  useTransformStyle: jest.fn((style) => ({
    normalStyle: style || {},
    hasSelfPercent: false,
    hasPositionFixed: false,
    hasVarDec: false,
    varContextRef: { current: {} },
    setWidth: jest.fn(),
    setHeight: jest.fn()
  })),
  useHover: jest.fn(() => ({
    isHover: false,
    gesture: {}
  })),
  wrapChildren: jest.fn((props) => props.children),
  useLayout: jest.fn(() => ({
    layoutRef: { current: null },
    layoutStyle: {},
    layoutProps: {}
  })),
  extendObject: jest.fn((...args) => Object.assign({}, ...args))
}))

jest.mock('../getInnerListeners', () => ({
  __esModule: true,
  default: jest.fn((props) => props),
  getCustomEvent: jest.fn((type, evt, ref, props) => ({ type, target: {} }))
}))

jest.mock('../useNodesRef', () => ({
  __esModule: true,
  default: jest.fn()
}))

describe('YourComponent Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  // 基础渲染测试
  it('should render without crashing', () => {
    const component = renderer.create(
      <YourComponent>Test Content</YourComponent>
    )
    
    const tree = component.toJSON()
    expect(tree).toBeTruthy()
    expect(tree).toMatchSnapshot()
  })

  // 属性测试
  it('should handle props correctly', () => {
    const component = renderer.create(
      <YourComponent 
        style={{ color: 'red' }}
        disabled={false}
        customProp="value"
      >
        Props Test
      </YourComponent>
    )
    
    const tree = component.toJSON()
    expect(tree).toBeTruthy()
    expect(tree).toMatchSnapshot()
  })

  // 更新测试
  it('should update correctly', () => {
    const component = renderer.create(
      <YourComponent>Initial</YourComponent>
    )
    
    let tree = component.toJSON()
    expect(tree).toBeTruthy()
    
    component.update(
      <YourComponent style={{ fontSize: 16 }}>Updated</YourComponent>
    )
    
    tree = component.toJSON()
    expect(tree).toBeTruthy()
  })
})
```

## 测试类型

### 1. **快照测试** (推荐)
- 自动生成组件结构快照
- 检测意外的组件结构变化
- 使用：`expect(tree).toMatchSnapshot()`

### 2. **属性测试**
- 测试不同 props 的渲染结果
- 测试条件渲染逻辑
- 测试默认值处理

### 3. **状态测试**
- 测试组件状态变化
- 测试交互后的状态更新
- 使用 `component.update()` 方法

### 4. **结构测试**
- 测试组件渲染结构
- 使用 `component.root.findAllByType()` 等方法

## 运行测试

```bash
# 运行所有简单测试
npm run test:react:simple

# 运行特定测试文件
npm run test:react:simple -- --testNamePattern="YourComponent"

# 监视模式（自动重新运行）
npm run test:react:simple -- --watch

# 更新快照
npm run test:react:simple -- --updateSnapshot
```

## 常见问题解决

### 1. 缺少 Mock 函数
如果遇到 "xxx is not a function" 错误，在对应的 mock 中添加：
```tsx
jest.mock('@mpxjs/utils', () => ({
  // 添加缺少的函数
  missingFunction: jest.fn()
}))
```

### 2. 组件导入问题
确保组件路径正确：
```tsx
import YourComponent from '../your-component' // 正确路径
```

### 3. 依赖 Mock 问题
根据组件使用的依赖添加相应的 mock。

## 最佳实践

1. **一个组件一个测试文件**
2. **使用描述性的测试名称**
3. **测试主要功能和边界情况**
4. **保持测试简单和专注**
5. **定期更新快照**
