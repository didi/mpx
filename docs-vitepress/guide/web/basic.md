# Web 跨端基础

Mpx 支持将小程序项目编译到 Web 平台，让开发者能够使用统一的小程序开发模式来构建 Web 应用。通过 Mpx 的跨端能力，可以实现小程序和 Web 的代码复用，大大提高开发效率。

## 特性概览

### 核心能力
- **统一开发体验** - 使用小程序的开发模式开发 Web 应用
- **代码复用** - 小程序代码可以直接编译到 Web 平台
- **组件映射** - 小程序组件自动映射为 Web 组件
- **API 适配** - 小程序 API 自动适配为 Web API
- **样式转换** - rpx 单位自动转换为响应式单位
- **路由系统** - 自动生成 Web 路由配置

### 支持程度
- ✅ 基础组件（view、text、image等）
- ✅ 表单组件（input、button、picker等）
- ✅ 导航组件（navigator等）
- ✅ 媒体组件（audio、video等）
- ✅ 地图组件（map）
- ✅ 画布组件（canvas）
- ✅ 开放能力组件（web-view等）
- ⚠️ 部分原生组件需要特殊处理

## 快速开始

### 1. 项目配置

在现有的小程序项目中添加 Web 编译配置：

```javascript
// vue.config.js
module.exports = {
  pluginOptions: {
    mpx: {
      srcMode: 'wx', // 源码模式
      plugin: {
        hackResolveBuildDependencies: ({ files, resolveDependencies }) => {
          const path = require('path')
          const packageJSONPath = path.resolve('package.json')
          if (files.has(packageJSONPath)) {
            resolveDependencies()
          }
        }
      },
      loader: {
        // Web 平台特殊配置
      }
    }
  }
}
```

### 2. 构建命令

```bash
# 开发模式
npm run serve:web

# 生产构建
npm run build:web
```

### 3. 项目结构

```
src/
├── pages/              # 页面目录
│   ├── index/
│   │   ├── index.mpx
│   │   └── index.web.mpx   # Web 平台特定实现
│   └── detail/
├── components/         # 组件目录
│   ├── common/
│   └── web/           # Web 专用组件
├── utils/             # 工具函数
├── store/             # 状态管理
├── styles/            # 样式文件
├── static/            # 静态资源
├── app.mpx            # 应用入口
└── app.json           # 应用配置
```

## 组件映射

### 基础组件

Mpx 会自动将小程序组件映射为对应的 Web 组件：

| 小程序组件 | Web 映射 | 说明 |
|------------|----------|------|
| `<view>` | `<div>` | 容器组件 |
| `<text>` | `<span>` | 文本组件 |
| `<image>` | `<img>` | 图片组件 |
| `<scroll-view>` | `<div>` + CSS | 滚动容器 |
| `<swiper>` | 自定义组件 | 轮播组件 |
| `<icon>` | `<i>` + CSS | 图标组件 |
| `<progress>` | `<progress>` | 进度条 |
| `<rich-text>` | `<div>` | 富文本 |

**示例：**

```html
<!-- 小程序代码 -->
<template>
  <view class="container">
    <text class="title">{{ title }}</text>
    <image :src="imageUrl" class="image" />
    <scroll-view scroll-y class="scroll-area">
      <view v-for="item in list" :key="item.id">
        {{ item.name }}
      </view>
    </scroll-view>
  </view>
</template>
```

```html
<!-- 编译后的 Web 代码 -->
<template>
  <div class="container">
    <span class="title">{{ title }}</span>
    <img :src="imageUrl" class="image" />
    <div class="scroll-area mpx-scroll-view">
      <div v-for="item in list" :key="item.id">
        {{ item.name }}
      </div>
    </div>
  </div>
</template>
```

### 表单组件

| 小程序组件 | Web 映射 | 说明 |
|------------|----------|------|
| `<input>` | `<input>` | 输入框 |
| `<textarea>` | `<textarea>` | 多行输入 |
| `<button>` | `<button>` | 按钮 |
| `<checkbox>` | `<input type="checkbox">` | 复选框 |
| `<radio>` | `<input type="radio">` | 单选框 |
| `<switch>` | 自定义组件 | 开关 |
| `<slider>` | `<input type="range">` | 滑块 |
| `<picker>` | 自定义组件 | 选择器 |

**表单示例：**

```html
<template>
  <view class="form">
    <input 
      :value="formData.name"
      placeholder="请输入姓名"
      @input="onNameInput"
    />
    <textarea 
      :value="formData.desc"
      placeholder="请输入描述"
      @input="onDescInput"
    />
    <button @tap="onSubmit">提交</button>
  </view>
</template>

<script>
export default {
  data() {
    return {
      formData: {
        name: '',
        desc: ''
      }
    }
  },
  methods: {
    onNameInput(e) {
      this.formData.name = e.detail.value
    },
    onDescInput(e) {
      this.formData.desc = e.detail.value
    },
    onSubmit() {
      console.log('提交表单', this.formData)
    }
  }
}
</script>
```

### 媒体组件

| 小程序组件 | Web 映射 | 说明 |
|------------|----------|------|
| `<audio>` | `<audio>` | 音频播放 |
| `<video>` | `<video>` | 视频播放 |
| `<camera>` | 自定义组件 | 相机 |
| `<live-player>` | 自定义组件 | 直播播放 |
| `<live-pusher>` | 自定义组件 | 直播推流 |

**视频组件示例：**

```html
<template>
  <view class="video-container">
    <video 
      :src="videoSrc"
      :poster="poster"
      :autoplay="false"
      :controls="true"
      @play="onPlay"
      @pause="onPause"
      @ended="onEnded"
    />
  </view>
</template>

<script>
export default {
  data() {
    return {
      videoSrc: 'https://example.com/video.mp4',
      poster: 'https://example.com/poster.jpg'
    }
  },
  methods: {
    onPlay() {
      console.log('视频开始播放')
    },
    onPause() {
      console.log('视频暂停')
    },
    onEnded() {
      console.log('视频播放结束')
    }
  }
}
</script>
```

## API 适配

### 网络请求

小程序的网络请求 API 会自动适配为 Web 的 fetch 或 XMLHttpRequest：

```javascript
// 小程序代码
wx.request({
  url: 'https://api.example.com/data',
  method: 'GET',
  data: {
    id: 123
  },
  success: (res) => {
    console.log(res.data)
  },
  fail: (err) => {
    console.error(err)
  }
})

// 使用统一 API
import { request } from '@mpxjs/api-proxy'

request({
  url: 'https://api.example.com/data',
  method: 'GET',
  data: {
    id: 123
  }
}).then(res => {
  console.log(res.data)
}).catch(err => {
  console.error(err)
})
```

### 存储 API

```javascript
// 小程序存储 API 自动适配为 localStorage
import { setStorageSync, getStorageSync, removeStorageSync } from '@mpxjs/api-proxy'

// 设置存储
setStorageSync('userInfo', {
  name: '张三',
  age: 25
})

// 获取存储
const userInfo = getStorageSync('userInfo')

// 删除存储
removeStorageSync('userInfo')
```

### 系统信息

```javascript
// 获取系统信息
import { getSystemInfoSync } from '@mpxjs/api-proxy'

const systemInfo = getSystemInfoSync()
console.log('平台:', systemInfo.platform) // 'web'
console.log('屏幕宽度:', systemInfo.screenWidth)
console.log('屏幕高度:', systemInfo.screenHeight)
```

### 导航 API

```javascript
// 页面导航
import { navigateTo, redirectTo, navigateBack } from '@mpxjs/api-proxy'

// 跳转到新页面
navigateTo({
  url: '/pages/detail/detail?id=123'
})

// 重定向
redirectTo({
  url: '/pages/login/login'
})

// 返回上一页
navigateBack({
  delta: 1
})
```

## 样式处理

### 单位转换

Mpx 会自动将 rpx 单位转换为响应式单位：

```css
<style>
.container {
  /* rpx 会自动转换为 vw */
  width: 750rpx;  /* 转换为 100vw */
  height: 400rpx; /* 转换为 53.33vw */
  
  /* px 单位保持不变 */
  border-width: 1px;
  
  /* 其他单位保持不变 */
  font-size: 16px;
  margin: 10px;
  padding: 5%;
}

.responsive {
  /* 响应式设计 */
  width: 100%;
  max-width: 750rpx; /* 最大宽度限制 */
  margin: 0 auto;
}
</style>
```

### CSS 兼容性

```css
<style>
.element {
  /* Flexbox 布局 */
  display: flex;
  justify-content: center;
  align-items: center;
  
  /* 变换 */
  transform: translateX(100rpx) scale(1.2);
  
  /* 动画 */
  transition: all 0.3s ease;
  
  /* 阴影 */
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  
  /* 圆角 */
  border-radius: 10rpx;
  
  /* 渐变 */
  background: linear-gradient(45deg, #ff6b6b, #4ecdc4);
}

/* 媒体查询 */
@media (max-width: 768px) {
  .container {
    padding: 20rpx;
  }
}

@media (min-width: 769px) {
  .container {
    padding: 40rpx;
  }
}
</style>
```

## 路由系统

### 自动路由生成

Mpx 会根据 `app.json` 中的页面配置自动生成 Web 路由：

```json
{
  "pages": [
    "pages/index/index",
    "pages/detail/detail",
    "pages/user/user"
  ],
  "tabBar": {
    "list": [
      {
        "pagePath": "pages/index/index",
        "text": "首页"
      },
      {
        "pagePath": "pages/user/user",
        "text": "我的"
      }
    ]
  }
}
```

生成的路由配置：

```javascript
// 自动生成的路由配置
const routes = [
  {
    path: '/',
    redirect: '/pages/index/index'
  },
  {
    path: '/pages/index/index',
    component: () => import('@/pages/index/index.mpx')
  },
  {
    path: '/pages/detail/detail',
    component: () => import('@/pages/detail/detail.mpx')
  },
  {
    path: '/pages/user/user',
    component: () => import('@/pages/user/user.mpx')
  }
]
```

### 路由参数

```javascript
// 页面接收路由参数
export default {
  onLoad(options) {
    // 小程序方式
    console.log('页面参数:', options)
  },
  
  // Web 路由方式
  created() {
    // 通过 $route 获取参数
    console.log('路由参数:', this.$route.query)
  }
}
```

## 平台差异处理

### 条件编译

```html
<template>
  <view class="container">
    <!-- 通用内容 -->
    <text class="title">{{ title }}</text>
    
    <!-- Web 特定内容 -->
    <!-- #ifdef web -->
    <div class="web-only">
      <button @click="onWebAction">Web 专用功能</button>
    </div>
    <!-- #endif -->
    
    <!-- 小程序特定内容 -->
    <!-- #ifndef web -->
    <button @tap="onMiniProgramAction">小程序专用功能</button>
    <!-- #endif -->
  </view>
</template>

<script>
export default {
  data() {
    return {
      title: 'Hello World'
    }
  },
  methods: {
    // #ifdef web
    onWebAction() {
      // Web 平台特定逻辑
      window.open('https://example.com')
    },
    // #endif
    
    // #ifndef web
    onMiniProgramAction() {
      // 小程序平台特定逻辑
      wx.navigateTo({
        url: '/pages/detail/detail'
      })
    }
    // #endif
  }
}
</script>

<style>
.container {
  padding: 20rpx;
}

/* #ifdef web */
.web-only {
  margin-top: 20px;
  padding: 10px;
  border: 1px solid #ccc;
}
/* #endif */
</style>
```

### 文件维度差异

对于差异较大的页面或组件，可以创建平台特定的文件：

```
pages/
├── map/
│   ├── map.mpx         # 小程序实现
│   └── map.web.mpx     # Web 实现
└── payment/
    ├── payment.mpx     # 小程序实现
    └── payment.web.mpx # Web 实现
```

**Web 特定实现示例：**

```html
<!-- map.web.mpx -->
<template>
  <div class="map-container">
    <div id="web-map" class="web-map"></div>
  </div>
</template>

<script>
export default {
  mounted() {
    this.initWebMap()
  },
  methods: {
    initWebMap() {
      // 使用 Web 地图 API（如高德、百度地图）
      const map = new AMap.Map('web-map', {
        zoom: 10,
        center: [116.397428, 39.90923]
      })
    }
  }
}
</script>

<style>
.map-container {
  width: 100%;
  height: 400px;
}

.web-map {
  width: 100%;
  height: 100%;
}
</style>
```

## 性能优化

### 代码分割

```javascript
// 路由懒加载
const routes = [
  {
    path: '/pages/index/index',
    component: () => import(/* webpackChunkName: "index" */ '@/pages/index/index.mpx')
  },
  {
    path: '/pages/detail/detail',
    component: () => import(/* webpackChunkName: "detail" */ '@/pages/detail/detail.mpx')
  }
]
```

### 资源优化

```javascript
// vue.config.js
module.exports = {
  configureWebpack: {
    optimization: {
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            name: 'vendor',
            test: /[\\/]node_modules[\\/]/,
            priority: 10,
            chunks: 'initial'
          },
          common: {
            name: 'common',
            minChunks: 2,
            priority: 5,
            chunks: 'initial',
            reuseExistingChunk: true
          }
        }
      }
    }
  }
}
```

### 图片优化

```html
<template>
  <view class="image-container">
    <!-- 响应式图片 -->
    <image 
      :src="imageUrl"
      :lazy-load="true"
      mode="aspectFit"
      class="responsive-image"
    />
    
    <!-- Web 特定优化 -->
    <!-- #ifdef web -->
    <img 
      :src="webImageUrl"
      :srcset="imageSrcSet"
      sizes="(max-width: 768px) 100vw, 50vw"
      loading="lazy"
      alt="图片描述"
    />
    <!-- #endif -->
  </view>
</template>

<script>
export default {
  computed: {
    webImageUrl() {
      return this.imageUrl + '?w=800'
    },
    imageSrcSet() {
      return `
        ${this.imageUrl}?w=400 400w,
        ${this.imageUrl}?w=800 800w,
        ${this.imageUrl}?w=1200 1200w
      `
    }
  }
}
</script>
```

## 调试和测试

### 开发调试

```bash
# 启动开发服务器
npm run serve:web

# 在浏览器中访问
# http://localhost:8080
```

### 浏览器兼容性

```javascript
// babel.config.js
module.exports = {
  presets: [
    ['@babel/preset-env', {
      targets: {
        browsers: [
          '> 1%',
          'last 2 versions',
          'not ie <= 8'
        ]
      },
      useBuiltIns: 'usage',
      corejs: 3
    }]
  ]
}
```

### 单元测试

```javascript
// tests/unit/example.spec.js
import { shallowMount } from '@vue/test-utils'
import HelloWorld from '@/components/HelloWorld.mpx'

describe('HelloWorld.mpx', () => {
  it('renders props.msg when passed', () => {
    const msg = 'new message'
    const wrapper = shallowMount(HelloWorld, {
      propsData: { msg }
    })
    expect(wrapper.text()).toMatch(msg)
  })
})
```

## 部署发布

### 构建配置

```javascript
// vue.config.js
module.exports = {
  publicPath: process.env.NODE_ENV === 'production' ? '/my-app/' : '/',
  outputDir: 'dist-web',
  assetsDir: 'static',
  productionSourceMap: false,
  
  pluginOptions: {
    mpx: {
      srcMode: 'wx'
    }
  }
}
```

### 构建命令

```bash
# 生产构建
npm run build:web

# 构建分析
npm run build:web -- --report
```

### 部署到静态服务器

```bash
# 部署到 GitHub Pages
npm run build:web
gh-pages -d dist-web

# 部署到 Nginx
scp -r dist-web/* user@server:/var/www/html/
```

## 最佳实践

### 1. 响应式设计

- 使用 rpx 单位实现响应式布局
- 合理使用媒体查询
- 考虑不同屏幕尺寸的适配

### 2. 性能优化

- 启用路由懒加载
- 优化图片资源
- 合理使用缓存策略

### 3. 用户体验

- 保持与小程序一致的交互体验
- 利用 Web 平台特性增强功能
- 做好错误处理和加载状态

### 4. SEO 优化

- 合理设置页面标题和描述
- 使用语义化标签
- 考虑服务端渲染（SSR）

## 下一步

- [Web 平台差异处理](./differences.md)
- [Web 性能优化](./optimization.md)
- [Web SEO 优化](./seo.md)