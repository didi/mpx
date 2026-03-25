# MPX React Native 上层业务性能优化实战指南

## 一、组件渲染优化

### 1.1 使用 memo 避免不必要的重渲染

MPX 的内置组件已经做了 memo 优化，但在业务组件中需要手动处理：

```jsx
// ❌ 错误：每次父组件渲染，子组件都会重渲染
import { View, Text } from '@mpxjs/webpack-plugin/lib/runtime/components/react/dist'

export default function Parent() {
  const [count, setCount] = useState(0)

  return (
    <View>
      <Child />
      <Text onPress={() => setCount(c => c + 1)}>{count}</Text>
    </View>
  )
}

function Child() {
  console.log('Child rendered')  // 每次 count 变化都会打印
  return <Text>Child Component</Text>
}
```

```jsx
// ✅ 正确：使用 memo 避免不必要的重渲染
import { View, Text } from '@mpxjs/webpack-plugin/lib/runtime/components/react/dist'
import { memo } from 'react'

const Child = memo(function Child() {
  console.log('Child rendered')
  return <Text>Child Component</Text>
})

export default function Parent() {
  const [count, setCount] = useState(0)

  return (
    <View>
      <Child />
      <Text onPress={() => setCount(c => c + 1)}>{count}</Text>
    </View>
  )
}
```

### 1.2 正确使用 useMemo

```jsx
// ❌ 错误：useMemo 依赖项不正确
const ExpensiveComponent = memo(function ({ list }) {
  // 依赖是对象，每次都创建新引用
  const sortedList = useMemo(() => {
    return list.sort((a, b) => a.id - b.id)
  }, [list])  // list 是新对象，永远不相等

  return (
    <View>
      {sortedList.map(item => <Text key={item.id}>{item.name}</Text>)}
    </View>
  )
})
```

```jsx
// ✅ 正确：使用正确的依赖项
const ExpensiveComponent = memo(function ({ list }) {
  // 使用原始值作为依赖
  const sortedList = useMemo(() => {
    return [...list].sort((a, b) => a.id - b.id)
  }, [list.length])  // 只依赖长度变化

  return (
    <View>
      {sortedList.map(item => <Text key={item.id}>{item.name}</Text>)}
    </View>
  )
})
```

### 1.3 回调函数使用 useCallback

```jsx
// ❌ 错误：每次渲染都创建新函数
function Parent() {
  const [text, setText] = useState('')

  const handlePress = () => {
    console.log(text)
  }

  return <Child onPress={handlePress} />
}
```

```jsx
// ✅ 正确：使用 useCallback 缓存回调
import { useCallback } from 'react'

function Parent() {
  const [text, setText] = useState('')

  const handlePress = useCallback(() => {
    console.log(text)
  }, [text])  // 只有 text 变化时才创建新函数

  return <Child onPress={handlePress} />
}
```

---

## 二、列表渲染优化

### 2.1 ScrollView vs 长列表

```jsx
// ❌ 错误：使用 ScrollView 渲染大数据列表
import { ScrollView, View, Text } from '@mpxjs/webpack-plugin/lib/runtime/components/react/dist'

function BadList({ items }) {
  return (
    <ScrollView>
      {items.map(item => (
        <View key={item.id}>
          <Text>{item.title}</Text>
        </View>
      ))}
    </ScrollView>
  )
}
```

```jsx
// ✅ 正确：使用 FlatList 虚拟化列表
import { FlatList, View, Text } from '@mpxjs/webpack-plugin/lib/runtime/components/react/dist'

function GoodList({ items }) {
  const renderItem = useCallback(({ item }) => (
    <View>
      <Text>{item.title}</Text>
    </View>
  ), [])  // 依赖项为空，函数引用不变

  const keyExtractor = useCallback((item) => item.id, [])

  return (
    <FlatList
      data={items}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      // 性能优化相关配置
      initialNumToRender={10}      // 首屏渲染数量
      maxToRenderPerBatch={10}     // 每批最大渲染数
      windowSize={5}               // 渲染窗口大小
      removeClippedSubviews={true} // 移除屏幕外的视图
      getItemLayout={(data, index) => ({
        length: 60,               // 每项高度
        offset: 60 * index,       // 偏移量
        index
      })}
    />
  )
}
```

### 2.2 列表项优化

```jsx
// ✅ 推荐：简化列表项组件
const ListItem = memo(function ListItem({ item, onPress }) {
  return (
    <View onPress={onPress}>
      <Text>{item.title}</Text>
    </View>
  )
}, (prevProps, nextProps) => {
  // 自定义比较逻辑
  return prevProps.item.id === nextProps.item.id
})

// 使用
<FlatList
  data={items}
  renderItem={({ item }) => (
    <ListItem
      item={item}
      onPress={() => handlePress(item.id)}
    />
  )}
/>
```

---

## 三、样式优化

### 3.1 使用 StyleSheet

```jsx
// ❌ 错误：每次渲染创建新样式对象
function BadComponent() {
  return (
    <View style={{
      padding: 10,
      margin: 5,
      backgroundColor: 'red'
    }}>
      <Text style={{ fontSize: 16 }}>Text</Text>
    </View>
  )
}
```

```jsx
// ✅ 正确：使用 StyleSheet 创建缓存的样式对象
import { StyleSheet } from 'react-native'

const styles = StyleSheet.create({
  container: {
    padding: 10,
    margin: 5,
    backgroundColor: 'red'
  },
  text: {
    fontSize: 16
  }
})

function GoodComponent() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Text</Text>
    </View>
  )
}
```

### 3.2 动态样式优化

```jsx
// ✅ 推荐：使用 StyleSheet.flatten 合并样式
import { StyleSheet } from 'react-native'

function DynamicStyle({ active, disabled }) {
  const containerStyle = StyleSheet.flatten([
    styles.base,
    active && styles.active,
    disabled && styles.disabled
  ])

  return <View style={containerStyle} />
}

const styles = StyleSheet.create({
  base: {
    padding: 10
  },
  active: {
    backgroundColor: 'blue'
  },
  disabled: {
    opacity: 0.5
  }
})
```

---

## 四、图片优化

### 4.1 图片加载优化

```jsx
// ✅ 正确：使用合适的 resizeMode 和尺寸
import { Image, View } from '@mpxjs/webpack-plugin/lib/runtime/components/react/dist'

function OptimizedImage({ uri }) {
  return (
    <View style={styles.container}>
      <Image
        source={{ uri }}
        style={styles.image}
        resizeMode="cover"  // 避免使用 'stretch'
        loadingIndicatorSource={require('./placeholder.png')}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: 100,
    height: 100
  },
  image: {
    width: '100%',
    height: '100%'
  }
})
```

### 4.2 大图处理

```jsx
// ✅ 正确：获取图片尺寸后渲染
import { Image, View } from 'react-native'
import { useState, useEffect } from 'react'

function LazyImage({ uri, style }) {
  const [size, setSize] = useState(null)

  useEffect(() => {
    Image.getSize(uri, (width, height) => {
      setSize({ width, height })
    })
  }, [uri])

  if (!size) {
    return <View style={[style, styles.placeholder]} />
  }

  return (
    <Image
      source={{ uri }}
      style={[style, { width: size.width, height: size.height }]}
    />
  )
}
```

---

## 五、动画优化

### 5.1 使用 react-native-reanimated

```jsx
// ✅ 推荐：使用 react-native-reanimated 进行高性能动画
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring
} from 'react-native-reanimated'
import { Pressable } from 'react-native'

function AnimatedButton({ onPress, children }) {
  const scale = useSharedValue(1)

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }))

  const handlePressIn = () => {
    scale.value = withSpring(0.95)
  }

  const handlePressOut = () => {
    scale.value = withSpring(1)
  }

  return (
    <Pressable onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
      <Animated.View style={[styles.button, animatedStyle]}>
        {children}
      </Animated.View>
    </Pressable>
  )
}
```

### 5.2 MPX 动画 API

```jsx
// ✅ MPX 动画使用示例
import { View, Text } from '@mpxjs/webpack-plugin/lib/runtime/components/react/dist'

function AnimationComponent() {
  const [show, setShow] = useState(false)

  return (
    <View>
      <View
        animation="{{ show ? 'fadeIn' : 'fadeOut' }}"
        duration="{{ 300 }}"
        onTouchEnd={() => setShow(!show)}
      >
        <Text>Animated View</Text>
      </View>
    </View>
  )
}
```

---

## 六、事件处理优化

### 6.1 事件传参优化

```jsx
// ✅ 推荐：使用闭包传参，避免创建过多 data-* 属性
import { View, Text } from '@mpxjs/webpack-plugin/lib/runtime/components/react/dist'

function EventComponent() {
  const handlePress = useCallback((id, name) => {
    console.log(id, name)
  }, [])

  return (
    <View>
      <Text onPress={() => handlePress(1, 'Alice')}>Item 1</Text>
      <Text onPress={() => handlePress(2, 'Bob')}>Item 2</Text>
    </View>
  )
}
```

### 6.2 长按事件

```jsx
// ✅ 正确：使用长按事件
import { View, Text } from '@mpxjs/webpack-plugin/lib/runtime/components/react/dist'

function LongPressComponent() {
  const handleLongPress = useCallback(() => {
    console.log('Long pressed!')
  }, [])

  return (
    <View bindlongpress={handleLongPress}>
      <Text>Long press me</Text>
    </View>
  )
}
```

---

## 七、状态管理优化

### 7.1 合理拆分 State

```jsx
// ❌ 错误：将不相关的数据放在同一个 state
function BadComponent() {
  const [state, setState] = useState({
    count: 0,
    username: '',
    userList: []
  })

  // 任何变化都会触发重新渲染
}
```

```jsx
// ✅ 正确：拆分独立的状态
function GoodComponent() {
  const [count, setCount] = useState(0)
  const [username, setUsername] = useState('')
  const [userList, setUserList] = useState([])

  // 只有 count 变化时，依赖 count 的组件才会重渲染
}
```

### 7.2 使用 useReducer 管理复杂状态

```jsx
// ✅ 推荐：复杂状态使用 useReducer
import { useReducer } from 'react'

const initialState = {
  loading: false,
  data: null,
  error: null
}

function reducer(state, action) {
  switch (action.type) {
    case 'FETCH_START':
      return { ...state, loading: true }
    case 'FETCH_SUCCESS':
      return { loading: false, data: action.payload }
    case 'FETCH_ERROR':
      return { loading: false, error: action.payload }
    default:
      return state
  }
}

function DataComponent() {
  const [state, dispatch] = useReducer(reducer, initialState)

  const fetchData = async () => {
    dispatch({ type: 'FETCH_START' })
    try {
      const data = await api.getData()
      dispatch({ type: 'FETCH_SUCCESS', payload: data })
    } catch (err) {
      dispatch({ type: 'FETCH_ERROR', payload: err })
    }
  }
}
```

---

## 八、网络请求优化

### 8.1 请求防抖

```jsx
import { useState, useEffect, useCallback } from 'react'
import { View, Text, Input } from '@mpxjs/webpack-plugin/lib/runtime/components/react/dist'

function SearchComponent() {
  const [keyword, setKeyword] = useState('')
  const [results, setResults] = useState([])

  // ✅ 使用 useCallback + debounce
  const debouncedSearch = useCallback(
    debounce(async (value) => {
      const data = await searchApi(value)
      setResults(data)
    }, 300),
    []
  )

  useEffect(() => {
    if (keyword) {
      debouncedSearch(keyword)
    }
  }, [keyword, debouncedSearch])

  return (
    <View>
      <Input value={keyword} onInput={e => setKeyword(e.detail.value)} />
      {results.map(item => <Text key={item.id}>{item.title}</Text>)}
    </View>
  )
}

function debounce(fn, delay) {
  let timer = null
  return function (...args) {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => fn.apply(this, args), delay)
  }
}
```

---

## 九、内存优化

### 9.1 清理定时器

```jsx
import { useEffect, useRef } from 'react'
import { View, Text } from '@mpxjs/webpack-plugin/lib/runtime/components/react/dist'

function TimerComponent() {
  const timerRef = useRef(null)

  useEffect(() => {
    timerRef.current = setInterval(() => {
      console.log('Timer running')
    }, 1000)

    // ✅ 清理函数
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [])

  return <Text>Timer Demo</Text>
}
```

### 9.2 避免闭包陷阱

```jsx
// ❌ 错误：闭包引用过期的 state
function BadCounter() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      console.log(count)  // count 永远是 0
    }, 1000)
    return () => clearInterval(timer)
  }, [])  // 空依赖，timer 永远使用初始的 count

  return <Text>{count}</Text>
}
```

```jsx
// ✅ 正确：使用 ref 访问最新值
function GoodCounter() {
  const [count, setCount] = useState(0)
  const countRef = useRef(count)

  useEffect(() => {
    countRef.current = count
  }, [count])

  useEffect(() => {
    const timer = setInterval(() => {
      console.log(countRef.current)  // 始终是最新的值
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  return <Text>{count}</Text>
}
```

---

## 十、构建优化

### 10.1 包体积优化

```javascript
// webpack.config.js
module.exports = {
  optimization: {
    // 启用 tree shaking
    usedExports: true,
    // 代码分割
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all'
        }
      }
    }
  }
}
```

### 10.2 Hermes 优化

```javascript
// metro.config.js
module.exports = {
  serializer: {
    getPolyfills: () => [
      'react-native/Libraries/Core/InitializeCore',
      // 按需添加 polyfill
    ]
  }
}
```

---

## 十一、最佳实践清单

### 组件开发

- [ ] 使用 `memo()` 包装纯展示组件
- [ ] 正确设置 `useMemo` 和 `useCallback` 的依赖项
- [ ] 避免在 JSX 中创建新对象
- [ ] 使用 `StyleSheet` 管理样式

### 列表渲染

- [ ] 使用 `FlatList` 替代 `ScrollView` + `Map`
- [ ] 设置 `keyExtractor`
- [ ] 配置 `initialNumToRender`、`maxToRenderPerBatch`
- [ ] 使用 `getItemLayout` 优化滚动性能

### 图片加载

- [ ] 使用合适的 `resizeMode`
- [ ] 大图使用 `Image.getSize` 预加载
- [ ] 使用 `loadingIndicatorSource` 显示占位图

### 动画

- [ ] 使用 `react-native-reanimated` 替代 JS 动画
- [ ] MPX 组件优先使用 `animation` 属性

### 网络请求

- [ ] 搜索等高频请求使用防抖
- [ ] 长列表使用分页加载

### 内存管理

- [ ] 及时清理 `setTimeout`、`setInterval`
- [ ] 避免闭包引用过期的 state
- [ ] 大数据使用虚拟列表
