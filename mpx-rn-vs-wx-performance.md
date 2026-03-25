# MPX React Native 与微信小程序性能优化差异点分析

## 一、渲染机制差异

### 1.1 渲染层差异

| 特性 | 微信小程序 | React Native |
|------|-----------|--------------|
| **渲染引擎** | 微信自定义渲染引擎 (WXML/WXSS) | React Native (JSC/Hermes) |
| **更新机制** | setData → 虚拟DOM diff → 渲染 | State/Props 更新 → React Re-render |
| **通信方式** | JSBridge (Native ↔ JS) | JSC/Hermes 直接执行 JS |
| **线程模型** | 逻辑层 + 渲染层分离 | 单线程 (UI + JS 同一线程) |

### 1.2 数据绑定差异

```javascript
// 微信小程序 - 使用 setData
this.setData({
  'list[0].name': 'newName',  // 路径更新
  count: this.data.count + 1
})

// React Native - 直接状态更新
this.setState({ count: this.state.count + 1 })
```

**优化重点：**
- 微信：小程序需要手动优化 setData 的数据量和频率，使用路径更新避免全量更新
- React Native：依赖 React 的 diff 算法，但需要注意避免不必要的 re-render

---

## 二、性能优化差异点

### 2.1 数据更新优化

#### 微信小程序

| 优化手段 | 说明 |
|---------|------|
| **路径更新** | 使用 `'list[0].name'` 而非更新整个 list |
| **数据分离** | 将频繁变化的数据与静态数据分离 |
| **批量更新** | 合并多次 setData 为一次 |
| **避免频繁调用** | 使用防抖/节流控制更新频率 |
| **数据精简** | 只传递需要展示的数据，避免传递大对象 |

```javascript
// ✅ 推荐：路径更新
this.setData({
  'items[0].checked': true
})

// ❌ 避免：全量更新
this.setData({
  items: this.data.items  // 完整拷贝
})
```

#### React Native

| 优化手段 | 说明 |
|---------|------|
| **memo/PureComponent** | 避免子组件不必要的 re-render |
| **useMemo/useCallback** | 缓存计算结果和回调函数 |
| **State 粒度** | 拆分 State，避免大对象 |
| **虚拟列表** | 长列表使用 FlatList/VirtualizedList |

```javascript
// ✅ 推荐：使用 memo 避免重渲染
const Child = memo(({ data }) => {
  return <Text>{data.name}</Text>
})

// ✅ 推荐：使用 useMemo 缓存计算结果
const computedValue = useMemo(() => {
  return heavyComputation(data)
}, [data])

// ✅ 推荐：使用 useCallback 缓存回调
const handlePress = useCallback(() => {
  // ...
}, [dep])
```

### 2.2 组件渲染优化

#### 微信小程序

- **组件懒加载**：使用 Component 构造器的 `lazyCodeLoading` 配置
- **基础库优化**：合理使用 `relations` 实现组件间通信
- **模板缓存**：避免在模板中进行复杂计算

#### React Native

- **React.memo**：函数组件级别的浅比较优化
- **React.PureComponent**：类组件级别的浅比较优化
- **Fragment**：减少不必要的 DOM 节点
- **Key**：合理设置列表项 key

```javascript
// React Native 组件优化示例
const OptimizedList = memo(({ items }) => {
  return (
    <FlatList
      data={items}
      renderItem={({ item }) => <ListItem item={item} />}
      keyExtractor={item => item.id}  // 避免使用 index
      initialNumToRender={10}         // 首屏渲染数量
      maxToRenderPerBatch={10}        // 每批渲染数量
      windowSize={5}                  // 可见区域外的渲染窗口
      removeClippedSubviews={true}    // 移除不可见组件
    />
  )
})
```

### 2.3 样式处理差异

| 特性 | 微信小程序 | React Native |
|------|-----------|--------------|
| **单位** | rpx (响应式) | pt/dp (固定) |
| **选择器** | 支持 class/id/标签 | 仅支持 style 对象 |
| **样式复用** | WXSS 类复用 | StyleSheet.create |
| **动态样式** | 三元表达式 | 状态驱动 |

#### 微信小程序样式优化
```css
/* 静态样式 - 推荐 */
.container {
  padding: 20rpx;
}

/* 动态样式 - 路径更新 */
<view class="item {{active ? 'active' : ''}}">
```

#### React Native 样式优化
```javascript
// ✅ 推荐：使用 StyleSheet
const styles = StyleSheet.create({
  container: {
    padding: 20
  }
})

// ✅ 推荐：条件样式使用 StyleSheet.flatten
const dynamicStyle = StyleSheet.flatten([
  styles.base,
  active && styles.active
])

// ❌ 避免：每次渲染创建新对象
<View style={{ padding: 20, backgroundColor: 'red' }} />
```

### 2.4 事件处理差异

| 特性 | 微信小程序 | React Native |
|------|-----------|--------------|
| **事件绑定** | bindtap / catchtap | onPress |
| **事件参数** | 通过 dataset 传递 | 直接函数传参 |
| **阻止冒泡** | catchtap | onPress={e => e.stopPropagation()} |

#### 微信小程序
```html
<view bindtap="handleTap" data-id="1" data-name="test">
  点击
</view>

Page({
  handleTap(e) {
    const { id, name } = e.currentTarget.dataset
  }
})
```

#### React Native
```jsx
<Pressable onPress={() => handlePress(id, name)}>
  <Text>点击</Text>
</Pressable>
```

### 2.5 动画实现差异

| 特性 | 微信小程序 | React Native |
|------|-----------|--------------|
| **动画API** | wx.createAnimation | Animated API |
| **性能** | 依赖原生实现 | JS 驱动，可搭配 Reanimated |
| **推荐方案** | CSS 动画 / 动画组件 | react-native-reanimated |

#### 微信小程序动画
```javascript
this.animation = wx.createAnimation({
  duration: 300,
  timingFunction: 'ease'
})
this.animation.translateX(100).step()
this.setData({ animation: this.animation.export() })
```

#### React Native 动画
```javascript
// 推荐：使用 react-native-reanimated
const translateX = useSharedValue(0)

const animatedStyle = useAnimatedStyle(() => ({
  transform: [{ translateX: translateX.value }]
}))

const handlePress = () => {
  translateX.value = withSpring(100)
}

return <Animated.View style={animatedStyle} />
```

---

## 三、构建产物差异

### 3.1 输出文件

| 微信小程序 | React Native |
|-----------|--------------|
| .wxml (模板) | JS Bundle |
| .wxss (样式) | 编译为 JS 样式对象 |
| .js (逻辑) | 直接作为 JS 执行 |
| .json (配置) | 编译到 JS 中 |

### 3.2 包体积优化

#### 微信小程序
- 开启 `ES6 -> ES5` 转换
- 开启代码压缩
- 使用 `subpackages` 分包加载
- 按需加载组件

#### React Native
- 使用 `react-native-vector-icons` 按需加载图标
- 合理拆分业务代码
- 使用 Hermes 引擎 (字节码加载更快)
- 避免大图片，使用 `resizeMode`

---

## 四、运行时性能差异

### 4.1 内存管理

| 场景 | 微信小程序 | React Native |
|------|-----------|--------------|
| **大数据渲染** | 使用虚拟列表组件 | 使用 FlatList |
| **图片加载** | 合理设置 mode | 使用缓存策略 |
| **组件卸载** | 手动清理定时器/事件 | useEffect cleanup |

### 4.2 启动性能

#### 微信小程序
- 减少 `app.js` 体积
- 合理使用 `onLaunch`
- 骨架屏优化首屏体验

#### React Native
- JS Bundle 体积优化
- Hermes 字节码预编译
- 启动图优化

---

## 五、针对性优化建议

### 5.1 React Native 特有优化

1. **减少 JS ↔ Native 通信**
   - 批量操作使用 `UIManager` 方法
   - 避免频繁调用 native 模块

2. **列表渲染优化**
   - 使用 `FlatList` 替代 `ScrollView` + `Map`
   - 设置 `getItemLayout` 避免测量

3. **图片优化**
   - 使用 `require()` 静态导入
   - 设置合适的 `resizeMode`
   - 大图使用 `Image.getSize` 获取尺寸

4. **Hermes 优化**
   - 预编译 bytecode
   - 开启 Hermes Proguard

### 5.2 微信小程序特有优化

1. **setData 优化**
   ```javascript
   // 场景：频繁更新某个值
   // ✅ 优化：合并更新
   this.setData({ value: newValue })

   // ✅ 优化：使用 data-* 传递静态数据
   <view data-static="{{staticData}}">
   ```

2. **长列表优化**
   - 使用 `recycle-view` (虚拟列表)
   - 分页加载

3. **WXS 优化**
   - 使用 WXS 处理高频事件
   - 避免在 WXS 中进行复杂计算

---

## 六、总结对比表

| 优化维度 | 微信小程序 | React Native |
|---------|-----------|--------------|
| **数据更新** | 路径更新、批量 setData | React.memo、useMemo |
| **组件渲染** | 组件懒加载 | React 虚拟 DOM diff |
| **样式处理** | rpx 响应式单位 | StyleSheet 缓存 |
| **事件处理** | dataset 传参 | 直接函数传参 |
| **动画** | createAnimation | Animated/Reanimated |
| **列表** | recycle-view | FlatList |
| **通信** | JSBridge | JSC/Hermes 直接执行 |
| **包体积** | 分包加载 | Hermes 字节码 |

---

## 七、最佳实践

### 通用优化原则

1. **减少不必要的渲染**
   - 微信：小程序使用 Component
   - React Native：使用 memo/PureComponent

2. **合理管理状态**
   - 微信：将动态/静态数据分离
   - React Native：拆分 State，使用 useReducer

3. **图片和资源优化**
   - 使用 CDN/OSS
   - 合理压缩
   - 按需加载

4. **代码分割**
   - 微信：subpackages 分包
   - React Native：CodePush/动态导入
