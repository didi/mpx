# 开发指南 

本仓库是 Mpx 的核心仓库，Mpx 是一款在微信原生小程序语法基础上进行了类 Vue 增强的跨端开发框架，能够以类似 Vue 的开发体验开发小程序及跨端应用，支持输出到多小程序平台、Web 和 React Native 环境中。

下面是本仓库中进行开发需要遵循的偏好指引及强制约束。

## 偏好指引

- 设计技术方案时尽量参考具有相似性的已有流程实现，尽可能复用当前已有流程实现，或者保持与已有流程实现的相似性
- 技术实现时尽可能复用现有流程与工具方法，追求最小的变动进行实现
- 编写代码时尽可能保持简洁精炼，避免无效的冗余代码，例如：
  - 避免声明不必要的中间变量
  - 避免编写不必要的中间步骤
  - 避免添加不必要的兜底值
  - 避免类似 `|| undefined` 的冗余兜底写法
  - 兜底逻辑统一添加到实现侧而不是调用侧，避免多重兜底
  - 避免添加不必要的容错判断
- 代码风格尽可能模仿当前仓库中现有的写法，例如：
  - 遍历数组用.forEach而不是for()


## 强制约束

### 编码约束

- 所有运行时代码中禁止使用Object spread特性进行对象合并，应当使用Object.assign或者内部等效工具方法进行合并

### 代码检查约束

- 新增功能编写单元测试时仅需覆盖核心功能，无需全量覆盖
- 任何过程中执行单元测试不通过时，仅尝试进行**2次**修复，如仍未通过则终止尝试，输出详细的错误信息以及对错误信息的分析
- 进行代码变更后仅需重新执行与当前变更代码相关的单元测试、eslint或类型检查，无需全量执行

## 路径指引

涉及具体子包的开发任务，先阅读对应子包的 `AGENTS.md` 获取入口文件、核心模块、典型调用链。

### 子包

| 子包 | 职责 | 文档 |
| --- | --- | --- |
| `@mpxjs/core` | 运行时核心：响应式、生命周期、跨端 patch、composition API | [packages/core/AGENTS.md](packages/core/AGENTS.md) |
| `@mpxjs/webpack-plugin` | Webpack 构建插件：`.mpx` SFC 编译、跨端到小程序/Web/RN | [packages/webpack-plugin/AGENTS.md](packages/webpack-plugin/AGENTS.md) |
| `@mpxjs/api-proxy` | 跨端宿主 API 统一封装与 promisify | [packages/api-proxy/AGENTS.md](packages/api-proxy/AGENTS.md) |
| `@mpxjs/fetch` | 网络请求封装：拦截器、取消、并发队列、proxy/validator | [packages/fetch/AGENTS.md](packages/fetch/AGENTS.md) |
| `@mpxjs/pinia` | Pinia 实现，跑在 Mpx 响应式之上 | [packages/pinia/AGENTS.md](packages/pinia/AGENTS.md) |
| `@mpxjs/store` | Vuex 风格 store（历史项目兼容） | [packages/store/AGENTS.md](packages/store/AGENTS.md) |
| `@mpxjs/utils` | 跨包共享纯工具库 | [packages/utils/AGENTS.md](packages/utils/AGENTS.md) |
| `@mpxjs/unocss-plugin` | Mpx × UnoCSS 集成插件（小程序 + Web） | [packages/unocss-plugin/AGENTS.md](packages/unocss-plugin/AGENTS.md) |
| `@mpxjs/unocss-base` | Mpx 专用 UnoCSS preset（rem → vw/rpx 换算） | [packages/unocss-base/AGENTS.md](packages/unocss-base/AGENTS.md) |
| `@mpxjs/size-report` | 构建产物体积分析与可视化 | [packages/size-report/AGENTS.md](packages/size-report/AGENTS.md) |
| `@mpxjs/webview-bridge` | H5 在小程序 webview 中的宿主 SDK 桥接 | [packages/webview-bridge/AGENTS.md](packages/webview-bridge/AGENTS.md) |
| `@mpxjs/babel-plugin-inject-page-events` | 注入小程序页面副作用事件钩子的 Babel 插件 | [packages/babel-plugin-inject-page-events/AGENTS.md](packages/babel-plugin-inject-page-events/AGENTS.md) |

### 路由建议

- 改运行时行为（响应式、生命周期、createApp/Page/Component、跨端 patch）→ [packages/core/AGENTS.md](packages/core/AGENTS.md)。
- 改编译/打包流程（loader、SFC 解析、模板/样式/JSON 编译、跨端到 Web/RN 的产物）→ [packages/webpack-plugin/AGENTS.md](packages/webpack-plugin/AGENTS.md)。
- 改宿主 API 适配 → [packages/api-proxy/AGENTS.md](packages/api-proxy/AGENTS.md)。
- 改纯工具函数 → [packages/utils/AGENTS.md](packages/utils/AGENTS.md)。
- 跨多个子包的改动：从依赖上游开始读起（`utils` → `core` → `webpack-plugin` → 其他子包）。
