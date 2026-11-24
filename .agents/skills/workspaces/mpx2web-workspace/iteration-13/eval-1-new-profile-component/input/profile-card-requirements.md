# ProfileCard 组件需求

创建 profile-card.mpx，使用选项式 API 和普通 CSS。

- 接收 title、summary 字符串属性，默认均为空。标题始终可见，摘要初始折叠；点击当前卡片切换 expanded，仅影响当前实例。
- 声明 accent-class 外部样式类并应用在标题上，同时保留 custom-class 的组件外部样式约定。
- 宿主会同时渲染两个实例，分别传入 warm-title、cool-title：提供不同文字颜色和 12px 内边距。不得把调用方颜色写死到组件中。
- 宿主已配置编译器 externalClasses 为 custom-class、i-class、accent-class，并提供两种调用方样式；本题只交付组件。不需要创建调用方页面或修改宿主配置。
