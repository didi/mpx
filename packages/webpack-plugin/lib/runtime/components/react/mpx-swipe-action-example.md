# MPX SwipeAction 左滑删除组件使用指南

## 组件介绍

`mpx-swipe-action` 是一个专为 React Native 环境设计的左滑删除组件，基于 [react-native-gesture-handler 的 ReanimatedSwipeable](https://docs.swmansion.com/react-native-gesture-handler/docs/components/reanimated_swipeable/) 实现，提供流畅的滑动体验和丰富的自定义选项。

## 功能特性

- ✅ 左滑显示操作按钮
- ✅ 支持自定义操作按钮样式和文本
- ✅ 流畅的动画效果
- ✅ 可配置滑动阈值
- ✅ 支持禁用功能
- ✅ 自动关闭其他已打开的组件
- ✅ 完整的事件回调支持

## 基本用法

```mpx
<template>
  <view class="container">
    <mpx-swipe-action 
      bindactiontap="handleDelete"
      bindopen="handleOpen"
      bindclose="handleClose">
      <view class="item">
        <text class="item-text">向左滑动我</text>
      </view>
    </mpx-swipe-action>
  </view>
</template>

<script>
  export default {
    methods: {
      handleDelete(e) {
        console.log('删除操作', e.detail)
        // 执行删除逻辑
      },
      handleOpen(e) {
        console.log('打开操作区域', e.detail)
      },
      handleClose(e) {
        console.log('关闭操作区域', e.detail)
      }
    }
  }
</script>

<style>
  .container {
    padding: 20rpx;
  }
  .item {
    background-color: #fff;
    padding: 30rpx 20rpx;
    border-radius: 10rpx;
    margin-bottom: 20rpx;
  }
  .item-text {
    font-size: 32rpx;
    color: #333;
  }
</style>
```

## 高级用法

### 单个操作按钮（原有API）

```mpx
<mpx-swipe-action 
  action-width="100"
  action-text="删除"
  action-color="#ff6b6b"
  action-text-color="#fff"
  action-background="#ff4757"
  bindactiontap="handleDelete">
  <view class="item">
    <text class="item-text">自定义删除按钮</text>
  </view>
</mpx-swipe-action>
```

### 多个操作按钮（新功能）

```mpx
<template>
  <mpx-swipe-action 
    actions="{{multiActions}}"
    bindactiontap="handleActionTap">
    <view class="item">
      <text class="item-text">支持多个操作按钮</text>
    </view>
  </mpx-swipe-action>
</template>

<script>
  export default {
    data() {
      return {
        multiActions: [
          {
            text: '编辑',
            color: '#4cd964', 
            width: 80
          },
          {
            text: '删除',
            color: '#ff4757',
            width: 80
          }
        ]
      }
    },
    methods: {
      handleActionTap(e) {
        const { actionIndex, actionText, action } = e.detail
        console.log(`点击了第${actionIndex}个按钮: ${actionText}`, action)
        
        if (actionIndex === 0) {
          // 编辑逻辑
          this.editItem()
        } else if (actionIndex === 1) {
          // 删除逻辑
          this.deleteItem()
        }
      }
    }
  }
</script>
```

### 设置滑动阈值和摩擦系数

```mpx
<mpx-swipe-action 
  right-threshold="80"
  friction="2"
  action-width="120"
  bindactiontap="handleDelete">
  <view class="item">
    <text class="item-text">需要滑动80px才能触发，摩擦系数为2</text>
  </view>
</mpx-swipe-action>
```

### 禁用组件

```mpx
<mpx-swipe-action 
  disabled="{{isDisabled}}"
  bindactiontap="handleDelete">
  <view class="item">
    <text class="item-text">{{isDisabled ? '已禁用' : '可滑动'}}</text>
  </view>
</mpx-swipe-action>
```

### 自定义多按钮样式和宽度

```mpx
<template>
  <mpx-swipe-action 
    actions="{{advancedActions}}"
    bindactiontap="handleActionTap">
    <view class="item">
      <text class="item-text">高级自定义按钮</text>
    </view>
  </mpx-swipe-action>
</template>

<script>
  export default {
    data() {
      return {
        advancedActions: [
          {
            text: '置顶',
            color: '#007aff',
            textColor: '#fff',
            width: 60,
            style: {
              borderRadius: 8,
              margin: 2
            }
          },
          {
            text: '编辑',
            color: '#4cd964',
            textColor: '#fff', 
            width: 80
          },
          {
            text: '删除',
            color: '#ff4757',
            textColor: '#fff',
            width: 80
          }
        ]
      }
    },
    methods: {
      handleActionTap(e) {
        const { actionIndex, actionText } = e.detail
        console.log(`点击了: ${actionText}`)
        
        switch (actionIndex) {
          case 0:
            this.pinToTop()
            break
          case 1:
            this.editItem()
            break
          case 2:
            this.deleteItem()
            break
        }
      }
    }
  }
</script>
```

## 属性说明

| 属性名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| **多按钮配置** |  |  |  |
| actions | Array | - | 多按钮配置数组，优先级高于单按钮配置 |
| **单按钮配置（向后兼容）** |  |  |  |
| action-width | Number | 80 | 操作按钮的宽度 |
| action-color | String | #ff4757 | 操作按钮的颜色（action-background 的别名） |
| action-text | String | 删除 | 操作按钮的文本 |
| action-text-color | String | #fff | 操作按钮文本颜色 |
| action-background | String | - | 操作按钮背景色，优先级高于 action-color |
| action-style | Object | {} | 自定义操作按钮样式对象 |
| **通用配置** |  |  |  |
| right-threshold | Number | totalWidth/2 | 触发打开操作的滑动阈值（px） |
| friction | Number | 1 | 滑动摩擦系数，值越大滑动越慢 |
| disabled | Boolean | false | 是否禁用滑动功能 |
| auto-close | Boolean | true | 是否自动关闭其他已打开的组件 |

### actions 数组配置项

每个 action 对象支持以下属性：

| 属性名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| text | String | - | 按钮文本（必填） |
| color | String | #ff4757 | 按钮背景色 |
| background | String | - | 按钮背景色（优先级高于 color） |
| textColor | String | #fff | 按钮文本颜色 |
| width | Number | 80 | 按钮宽度 |
| style | Object | {} | 自定义按钮样式对象 |

## 事件说明

| 事件名 | 说明 | 回调参数 |
|--------|------|----------|
| bindactiontap | 点击操作按钮时触发 | {detail: {actionIndex, actionText, actionWidth, action}} |
| bindopen | 打开操作区域时触发 | {detail: {actionWidth, actions, actionCount}} |
| bindclose | 关闭操作区域时触发 | {detail: {}} |
| bindtap | 点击内容区域时触发（当组件关闭状态） | {detail: {}} |

### bindactiontap 事件参数详解

| 参数名 | 类型 | 说明 |
|--------|------|------|
| actionIndex | Number | 被点击按钮的索引（从0开始） |
| actionText | String | 被点击按钮的文本 |
| actionWidth | Number | 被点击按钮的宽度 |
| action | Object | 被点击按钮的完整配置对象 |

### bindopen 事件参数详解

| 参数名 | 类型 | 说明 |
|--------|------|------|
| actionWidth | Number | 所有按钮的总宽度 |
| actions | Array | 所有按钮的配置数组 |
| actionCount | Number | 按钮总数 |

## 注意事项

1. **性能优化**: 组件使用了 `react-native-reanimated` 来实现流畅的动画效果
2. **手势冲突**: 如果页面中有其他滑动组件，可能需要调整手势优先级
3. **自动关闭**: 当 `auto-close` 为 true 时，打开一个组件会自动关闭其他已打开的组件
4. **滑动方向**: 目前只支持左滑操作，向右滑动会被忽略
5. **容器样式**: 组件会设置 `overflow: hidden`，确保滑动效果正常显示

## 示例场景

### 1. 消息列表删除

```mpx
<view class="message-list">
  <mpx-swipe-action 
    wx:for="{{messages}}" 
    wx:key="id"
    bindactiontap="deleteMessage"
    data-message-id="{{item.id}}">
    <view class="message-item">
      <text class="message-content">{{item.content}}</text>
      <text class="message-time">{{item.time}}</text>
    </view>
  </mpx-swipe-action>
</view>
```

### 2. 购物车商品删除

```mpx
<view class="cart-list">
  <mpx-swipe-action 
    wx:for="{{cartItems}}" 
    wx:key="id"
    action-text="移除"
    action-color="#ff6b6b"
    bindactiontap="removeFromCart"
    data-item-id="{{item.id}}">
    <view class="cart-item">
      <image class="item-image" src="{{item.image}}"></image>
      <view class="item-info">
        <text class="item-name">{{item.name}}</text>
        <text class="item-price">¥{{item.price}}</text>
      </view>
    </view>
  </mpx-swipe-action>
</view>
```

### 3. 待办事项管理（多按钮）

```mpx
<view class="todo-list">
  <mpx-swipe-action 
    wx:for="{{todos}}" 
    wx:key="id"
    actions="{{todoActions}}"
    bindactiontap="handleTodoAction"
    data-todo-id="{{item.id}}">
    <view class="todo-item">
      <text class="todo-text">{{item.text}}</text>
    </view>
  </mpx-swipe-action>
</view>

<script>
  export default {
    data() {
      return {
        todoActions: [
          {
            text: '编辑',
            color: '#007aff',
            width: 70
          },
          {
            text: '完成',
            color: '#4cd964',
            width: 70
          },
          {
            text: '删除',
            color: '#ff4757',
            width: 70
          }
        ]
      }
    },
    methods: {
      handleTodoAction(e) {
        const { actionIndex } = e.detail
        const todoId = e.currentTarget.dataset.todoId
        
        switch (actionIndex) {
          case 0:
            this.editTodo(todoId)
            break
          case 1:
            this.completeTodo(todoId)
            break
          case 2:
            this.deleteTodo(todoId)
            break
        }
      }
    }
  }
</script>
```

### 4. 邮件管理（多按钮）

```mpx
<view class="email-list">
  <mpx-swipe-action 
    wx:for="{{emails}}" 
    wx:key="id"
    actions="{{emailActions}}"
    bindactiontap="handleEmailAction"
    data-email-id="{{item.id}}">
    <view class="email-item">
      <text class="email-subject">{{item.subject}}</text>
      <text class="email-sender">{{item.sender}}</text>
    </view>
  </mpx-swipe-action>
</view>

<script>
  export default {
    data() {
      return {
        emailActions: [
          {
            text: '标记',
            color: '#ff9500',
            width: 60
          },
          {
            text: '归档',
            color: '#5856d6',
            width: 60
          },
          {
            text: '删除',
            color: '#ff4757',
            width: 60
          }
        ]
      }
    }
  }
</script>
```

## 技术实现

组件基于以下技术实现：
- **React Native**: 基础 UI 框架
- **react-native-gesture-handler**: 手势处理，基于 [ReanimatedSwipeable](https://docs.swmansion.com/react-native-gesture-handler/docs/components/reanimated_swipeable/)
- **react-native-reanimated**: 高性能动画
- **TypeScript**: 类型安全保障

## 优势对比

### 相比自定义实现的优势：
1. **更好的性能**: 基于成熟的手势处理库，使用原生动画
2. **更少的代码**: 无需自己处理复杂的手势状态
3. **更好的兼容性**: 经过大量项目验证
4. **更丰富的功能**: 支持摩擦系数、阈值等高级配置
5. **多按钮支持**: 支持单个和多个操作按钮，满足复杂交互需求
6. **向后兼容**: 完全兼容原有单按钮API，平滑升级

组件已经完全集成到 MPX 框架中，可以直接在 MPX 项目中使用，无需额外配置。
