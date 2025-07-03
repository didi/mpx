# PickerView 组件

基于 Vue.js 开发的滚动选择器组件，模仿微信小程序的 `picker-view` 组件。支持多列选择、双向数据绑定、自定义样式等功能。

## 特性

- ✅ 支持 `value` 属性和 `change` 事件的双向数据绑定
- ✅ 支持多列选择器
- ✅ 支持触摸滚动和鼠标滚动
- ✅ 支持惯性滚动
- ✅ 支持自定义样式（指示器、遮罩等）
- ✅ 支持滚动开始和结束事件
- ✅ 支持编程控制选中项
- ✅ 响应式设计，适配移动端和桌面端
- ✅ 渐变遮罩效果
- ✅ 选项透明度和缩放动画

## 快速开始

### 基础用法

```vue
<template>
  <PickerView 
    :value="selectedValue" 
    @change="handleChange"
    style="height: 200px;"
  >
    <PickerViewColumn>
      <div v-for="item in options" :key="item">{{ item }}</div>
    </PickerViewColumn>
  </PickerView>
</template>

<script>
import PickerView from './PickerView.vue'
import PickerViewColumn from './PickerViewColumn.vue'

export default {
  components: {
    PickerView,
    PickerViewColumn
  },
  data() {
    return {
      selectedValue: [0], // 选中第一项
      options: ['选项1', '选项2', '选项3', '选项4']
    }
  },
  methods: {
    handleChange(event) {
      console.log('选中项变化:', event.detail.value)
      this.selectedValue = event.detail.value
    }
  }
}
</script>
```

### 多列选择器

```vue
<template>
  <PickerView 
    :value="dateValue" 
    @change="handleDateChange"
    style="height: 200px;"
  >
    <PickerViewColumn>
      <div v-for="year in years" :key="year">{{ year }}年</div>
    </PickerViewColumn>
    <PickerViewColumn>
      <div v-for="month in months" :key="month">{{ month }}月</div>
    </PickerViewColumn>
    <PickerViewColumn>
      <div v-for="day in days" :key="day">{{ day }}日</div>
    </PickerViewColumn>
  </PickerView>
</template>

<script>
export default {
  data() {
    return {
      dateValue: [0, 0, 0], // [年索引, 月索引, 日索引]
      years: [2020, 2021, 2022, 2023, 2024],
      months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      days: Array.from({length: 31}, (_, i) => i + 1)
    }
  },
  methods: {
    handleDateChange(event) {
      this.dateValue = event.detail.value
    }
  }
}
</script>
```

## API 文档

### PickerView 属性

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| value | Array | [] | 数组中的数字依次表示 picker-view 内的 picker-view-column 选择的第几项（下标从 0 开始） |
| indicator-style | String | '' | 设置选择器中间选中框的样式 |
| indicator-class | String | '' | 设置选择器中间选中框的类名 |
| mask-style | String | '' | 设置蒙层的样式 |
| mask-class | String | '' | 设置蒙层的类名 |
| immediate-change | Boolean | false | 是否在手指松开时立即触发 change 事件 |

### PickerView 事件

| 事件名 | 说明 | 回调参数 |
|--------|------|----------|
| change | 滚动选择时触发 | event.detail = {value: Array} |
| pickstart | 当滚动选择开始时触发 | event |
| pickend | 当滚动选择结束时触发 | event |

## 样式定制

### 基础样式定制

```vue
<PickerView 
  style="height: 200px; border: 1px solid #ddd; border-radius: 8px;"
  indicator-style="height: 40px; background-color: rgba(0, 0, 0, 0.05);"
  mask-style="background: rgba(255, 255, 255, 0.8);"
>
  <!-- 内容 -->
</PickerView>
```

### 通过 CSS 类定制

```vue
<PickerView 
  indicator-class="custom-indicator"
  mask-class="custom-mask"
>
  <!-- 内容 -->
</PickerView>
```

```css
.custom-indicator {
  border-top: 2px solid #007AFF;
  border-bottom: 2px solid #007AFF;
  background: rgba(0, 122, 255, 0.1);
}

.custom-mask {
  background: linear-gradient(to bottom, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.7));
}
```

## 事件处理详解

### 基础事件处理

```javascript
methods: {
  handleChange(event) {
    // event.detail.value 是一个数组，包含每列的选中索引
    console.log('选中的索引:', event.detail.value)
    
    // 更新本地数据
    this.selectedValue = event.detail.value
    
    // 获取实际选中的值
    const selectedItems = event.detail.value.map((index, columnIndex) => {
      return this.options[columnIndex][index]
    })
    console.log('选中的项目:', selectedItems)
  }
}
```

### 级联选择器事件处理

```javascript
methods: {
  handleCityChange(event) {
    const newValue = event.detail.value
    
    // 如果省份改变，重置市和区的选择
    if (newValue[0] !== this.cityValue[0]) {
      this.cityValue = [newValue[0], 0, 0]
    }
    // 如果城市改变，重置区的选择
    else if (newValue[1] !== this.cityValue[1]) {
      this.cityValue = [newValue[0], newValue[1], 0]
    }
    // 否则直接更新
    else {
      this.cityValue = newValue
    }
  }
}
```

## 常见用例

### 时间选择器

```vue
<template>
  <PickerView :value="timeValue" @change="handleTimeChange">
    <PickerViewColumn>
      <div v-for="hour in 24" :key="hour">{{ String(hour - 1).padStart(2, '0') }}</div>
    </PickerViewColumn>
    <PickerViewColumn>
      <div v-for="minute in 60" :key="minute">{{ String(minute - 1).padStart(2, '0') }}</div>
    </PickerViewColumn>
  </PickerView>
</template>
```

### 数字选择器

```vue
<template>
  <PickerView :value="numberValue" @change="handleNumberChange">
    <PickerViewColumn>
      <div v-for="num in 10" :key="num">{{ num - 1 }}</div>
    </PickerViewColumn>
    <PickerViewColumn>
      <div>.</div>
    </PickerViewColumn>
    <PickerViewColumn>
      <div v-for="num in 10" :key="num">{{ num - 1 }}</div>
    </PickerViewColumn>
  </PickerView>
</template>
```

## 注意事项

1. **高度设置**：PickerView 组件需要明确的高度才能正常工作，建议设置 `height: 200px` 或更大。

2. **数据更新**：当选项数据发生变化时，组件会自动重新渲染，但建议在数据变化后检查 `value` 数组是否仍然有效。

3. **性能优化**：对于大量数据，建议使用 `v-for` 时添加 `key` 属性以提高渲染性能。

4. **移动端适配**：组件已经适配了触摸事件，在移动端可以正常使用。

5. **浏览器兼容性**：组件使用了现代 CSS 特性，建议在支持 ES6+ 的浏览器中使用。

## 浏览器支持

- Chrome 60+
- Firefox 55+
- Safari 12+
- Edge 79+
- iOS Safari 12+
- Android Chrome 60+

## 许可证

MIT License 