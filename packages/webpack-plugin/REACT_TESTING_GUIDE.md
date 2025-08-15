# React Components 单元测试指南

本指南介绍如何为 `runtime/components/react` 文件夹下的 React Native 组件编写单元测试。

## 目录结构

```
packages/webpack-plugin/
├── lib/runtime/components/react/
│   ├── __tests__/                    # 测试文件目录
│   │   ├── mpx-button.test.tsx
│   │   ├── mpx-view.test.tsx
│   │   ├── mpx-text.test.tsx
│   │   └── mpx-input.test.tsx
│   └── [组件文件]
├── test/
│   ├── setup.js                      # Jest 测试环境设置
│   └── utils/
│       └── test-utils.tsx            # 测试工具函数
├── __mocks__/                        # Mock 文件
│   ├── react-native-linear-gradient.js
│   ├── react-native-gesture-handler.js
│   ├── react-native-reanimated.js
│   └── react-native-fast-image.js
├── scripts/
│   └── test-react-components.js      # 测试运行脚本
├── jest.config.json                  # Jest 配置
└── tsconfig.test.json                # TypeScript 测试配置
```

## 快速开始

### 1. 安装依赖

确保已安装所有必要的测试依赖：

```bash
npm install --save-dev @testing-library/react-native @testing-library/jest-dom react-test-renderer ts-jest
```

### 2. 运行测试

```bash
# 运行所有 React 组件测试
npm run test:react

# 运行特定组件的测试
npm run test:react -- --testNamePattern="Button"

# 运行测试并生成覆盖率报告
npm run test:react -- --coverage

# 监听模式运行测试
npm run test:react -- --watch
```

### 3. 使用测试脚本

```bash
# 使用专用脚本运行测试
node scripts/test-react-components.js

# 带覆盖率
node scripts/test-react-components.js --coverage

# 监听模式
node scripts/test-react-components.js --watch
```

## 编写测试

### 基本测试结构

```tsx
import React from 'react'
import { fireEvent } from '@testing-library/react-native'
import { render } from '../../../test/utils/test-utils'
import YourComponent from '../your-component'

describe('YourComponent', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render correctly', () => {
    const { getByText } = render(
      <YourComponent>Test Content</YourComponent>
    )
    
    expect(getByText('Test Content')).toBeTruthy()
  })
})
```

### 测试工具函数

我们提供了一些有用的测试工具函数：

```tsx
import { 
  render, 
  createMockEvent, 
  createMockLayoutEvent,
  mockImageGetSize 
} from '../../../test/utils/test-utils'

// 创建模拟事件
const mockEvent = createMockEvent('press', { target: { value: 'test' } })

// 创建模拟布局事件
const mockLayout = createMockLayoutEvent(100, 200)

// 模拟图片尺寸获取
const mockGetSize = mockImageGetSize(300, 200)
```

### Mock 依赖

由于组件依赖许多工具函数，需要适当地 mock 这些依赖：

```tsx
// Mock 工具函数
jest.mock('../utils', () => ({
  splitProps: jest.fn((props) => ({ textProps: {}, innerProps: props })),
  splitStyle: jest.fn((style) => ({ textStyle: {}, backgroundStyle: {}, innerStyle: style })),
  useTransformStyle: jest.fn((style) => ({
    normalStyle: style,
    hasSelfPercent: false,
    hasPositionFixed: false,
    hasVarDec: false,
    varContextRef: { current: {} },
    setWidth: jest.fn(),
    setHeight: jest.fn()
  })),
  // ... 其他工具函数
}))

// Mock hooks
jest.mock('../getInnerListeners', () => ({
  __esModule: true,
  default: jest.fn((props) => props)
}))
```

## 测试模式

### 1. 渲染测试

测试组件是否正确渲染：

```tsx
it('renders with correct content', () => {
  const { getByText } = render(<Button>Click me</Button>)
  expect(getByText('Click me')).toBeTruthy()
})
```

### 2. 属性测试

测试组件属性是否正确应用：

```tsx
it('applies disabled state correctly', () => {
  const { getByText } = render(<Button disabled>Disabled</Button>)
  const button = getByText('Disabled').parent
  expect(button.props.disabled).toBe(true)
})
```

### 3. 事件测试

测试用户交互和事件处理：

```tsx
it('handles tap events', () => {
  const mockOnTap = jest.fn()
  const { getByText } = render(<Button bindtap={mockOnTap}>Tap me</Button>)
  
  fireEvent.press(getByText('Tap me').parent)
  expect(mockOnTap).toHaveBeenCalled()
})
```

### 4. 样式测试

测试样式是否正确应用：

```tsx
it('applies custom styles', () => {
  const customStyle = { backgroundColor: 'red' }
  const { getByTestId } = render(
    <View style={customStyle} testID="styled-view">Content</View>
  )
  
  expect(getByTestId('styled-view')).toBeTruthy()
})
```

### 5. 条件渲染测试

测试基于状态的条件渲染：

```tsx
it('shows loading state', () => {
  const { getByTestId } = render(<Button loading>Loading</Button>)
  expect(getByTestId('loading')).toBeTruthy()
})
```

## 常见测试场景

### 测试表单组件

```tsx
describe('Input Component', () => {
  it('handles text input changes', () => {
    const mockOnInput = jest.fn()
    const { getByDisplayValue } = render(
      <Input value="" bindinput={mockOnInput} />
    )
    
    const input = getByDisplayValue('')
    fireEvent.changeText(input, 'new text')
    
    expect(mockOnInput).toHaveBeenCalled()
  })
})
```

### 测试列表组件

```tsx
describe('List Component', () => {
  it('renders list items correctly', () => {
    const items = ['Item 1', 'Item 2', 'Item 3']
    const { getByText } = render(<List items={items} />)
    
    items.forEach(item => {
      expect(getByText(item)).toBeTruthy()
    })
  })
})
```

### 测试异步操作

```tsx
describe('Async Component', () => {
  it('handles async data loading', async () => {
    const mockData = { title: 'Test Data' }
    const mockFetch = jest.fn().mockResolvedValue(mockData)
    
    const { findByText } = render(<AsyncComponent fetchData={mockFetch} />)
    
    expect(await findByText('Test Data')).toBeTruthy()
  })
})
```

## 覆盖率要求

建议保持以下覆盖率标准：

- **语句覆盖率**: > 80%
- **分支覆盖率**: > 75%
- **函数覆盖率**: > 80%
- **行覆盖率**: > 80%

查看覆盖率报告：

```bash
npm run test:react -- --coverage
open coverage/react-components/lcov-report/index.html
```

## 调试测试

### 使用 debug 模式

```tsx
import { render, screen } from '../../../test/utils/test-utils'

it('debugs component structure', () => {
  const { debug } = render(<YourComponent />)
  debug() // 打印组件结构
})
```

### 查看渲染结果

```tsx
it('inspects rendered component', () => {
  const { getByTestId } = render(<YourComponent testID="test-component" />)
  const component = getByTestId('test-component')
  console.log('Component props:', component.props)
})
```

## 最佳实践

### 1. 测试文件组织

- 每个组件对应一个测试文件
- 测试文件放在 `__tests__` 目录下
- 使用描述性的测试名称

### 2. Mock 策略

- Mock 外部依赖和复杂的工具函数
- 保持 Mock 简单和一致
- 在 `beforeEach` 中清理 Mock

### 3. 测试数据

- 使用有意义的测试数据
- 避免硬编码值
- 考虑边界情况

### 4. 断言

- 使用具体的断言
- 测试用户关心的行为
- 避免过度测试实现细节

### 5. 性能

- 避免不必要的渲染
- 合理使用 `beforeEach` 和 `afterEach`
- 考虑测试运行时间

## 故障排除

### 常见错误

1. **模块未找到错误**
   - 检查 `moduleNameMapper` 配置
   - 确保 Mock 文件路径正确

2. **React Native 组件错误**
   - 确保使用了正确的 preset
   - 检查 `transformIgnorePatterns`

3. **TypeScript 错误**
   - 检查 `tsconfig.test.json` 配置
   - 确保类型定义正确

4. **异步测试失败**
   - 使用 `findBy*` 方法等待异步操作
   - 适当使用 `waitFor`

### 获取帮助

如果遇到问题，可以：

1. 查看现有的测试示例
2. 检查 Jest 和 React Testing Library 文档
3. 在项目中搜索类似的测试模式

## 参考资源

- [React Testing Library](https://testing-library.com/docs/react-native-testing-library/intro/)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Native Testing](https://reactnative.dev/docs/testing-overview)
- [Testing Library Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
