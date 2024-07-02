# RN 自定义组件支持
创建自定义组件在 RN 环境下部分实例方法、属性存在兼容性问题不支持，
此文档以微信小程序为参照，会详细列出各方法、属性的支持度。

## 参数


### 组件定义属性说明

| 属性       | 类型             | RN 是否支持 | 描述                                                                        |
|------------|------------------|---------|---------------------------------------------------------------------------|
| properties | Object Map       | 是       | 组件的对外属性，是属性名到属性设置的映射表                                                     |
| data       | Object           | 是       | 组件的内部数据，和 `properties` 一同用于组件的模板渲染                                        |
| observers  | Object           | 是       | 组件数据字段监听器，用于监听 `properties` 和 `data` 的变化                                  |
| methods    | Object           | 是       | 组件的方法，包括事件响应函数和任意的自定义方法，关于事件响应函数的使用                                       |
| behaviors  | String Array     | 否       | 输出 RN 不支持                                                                 |
| created    | Function         | 是       | 组件生命周期函数-在组件实例刚刚被创建时执行，注意此时不能调用 `setData`                                 |
| attached   | Function         | 是       | 组件生命周期函数-在组件实例进入页面节点树时执行                                                  |
| ready      | Function         | 是       | 组件生命周期函数-在组件布局完成后执行                                                       |
| moved      | Function         | 否       | RN 不支持，组件生命周期函数-在组件实例被移动到节点树另一个位置时执行                                      |
| detached   | Function         | 是       | 组件生命周期函数-在组件实例被从页面节点树移除时执行                                                |
| relations  | Object           | 否       | 输出 RN 不支持                                                                 |
| externalClasses | String Array | 否       | 输出 RN 不支持                                                                 |
| options    | Object Map       | 否       | 输出 RN 不支持，一些选项，诸如 multipleSlots、virtualHost、pureDataPattern，这些功能输出 RN 不支持 |
| lifetimes  | Object           | 是       | 组件生命周期声明对象                                                                |
| pageLifetimes | Object       | 是       | 组件所在页面的生命周期声明对象                                                           |

### 组件实例属性与方法
生成的组件实例可以在组件的方法、生命周期函数中通过 this 访问。组件包含一些通用属性和方法。

| 属性名  | 类型     | RN 是否支持 | 描述                       |
|--------|----------|---------|--------------------------|
| is     | String   | 否       | 输出 RN 暂不支持，未来支持, 组件的文件路径 |
| id     | String   | 是       | 节点id                     |
| dataset| String   | 是       | 节点dataset                |
| data   | Object   | 否       | 组件数据，通过 this 直接访问        |
| properties | Object | 否       | 组件props，通过 this 直接访问     |
| router | Object   | 否       | 输出 RN 暂不支持               |
| pageRouter | Object | 否       | 输出 RN 暂不支持               |
| renderer | string | 否       | 输出 RN 暂不支持               |

微信小程序原生方法

| 方法名               | RN是否支持 | 参数                                      | 描述                       |
|---------------------|--------|-------------------------------------------|--------------------------|
| setData             | 是      | Object newData                            | 设置data并执行视图层渲染           |
| hasBehavior         | 否      | Object behavior                           | 检查组件是否具有 behavior        |
| triggerEvent        | 是      | String name, Object detail, Object options| 触发事件                     |
| createSelectorQuery| 否      |                                           | 输出 RN 暂不支持，未来支持，建议使用 ref |
| createIntersectionObserver| 否      |                                           | 输出 RN 暂不支持       |
| selectComponent     | 否      | String selector                          | 输出 RN 暂不支持，未来支持，建议使用 ref       |
| selectAllComponents| 否      | String selector                          | 输出 RN 暂不支持，未来支持，建议使用 ref       |
| selectOwnerComponent| 否      |                                           | 输出 RN 不支持                |
| getRelationNodes    | 否      | String relationKey                        | 输出 RN 不支持                |
| groupSetData        | 否      | Function callback                         | 输出 RN 不支持                |
| getTabBar           | 否      |                                           | 输出 RN 不支持                |
| getPageId           | 否      |                                           | 输出 RN 不支持                |
| animate             | 否      | String selector, Array keyframes, ...     | 输出 RN 不支持                |
| clearAnimation      | 否      | String selector, Object options, ...      | 输出 RN 不支持                |

Mpx 框架增强实例方法

| 方法名               | RN是否支持 | 描述                                                 |
|---------------------|--------|-----------------------------------------------------|
| $set             | 是      | 向响应式对象中添加一个 property，并确保这个新 property 同样是响应式的，且触发视图更新       |
| $watch         | 是      | 观察 Mpx 实例上的一个表达式或者一个函数计算结果的变化                               |
| $delete        | 是      | 删除对象属性，如果该对象是响应式的，那么该方法可以触发观察器更新（视图更新 | watch回调）             |
| $refs        | 是      | 一个对象，持有注册过 ref的所有 DOM 元素和组件实例，调用响应的组件方法或者获取视图节点信息。 |
| $asyncRefs        | 否      | 输出 RN 不支持                    |
| $forceUpdate        | 是      | 用于强制刷新视图，不常用，通常建议使用响应式数据驱动视图更新                            |
| $nextTick        | 是      | 在下次 DOM 更新循环结束之后执行延迟回调函数，用于等待 Mpx 完成状态更新和 DOM 更新后再执行某些操作 |
| $i18n        | 否      | 输出 RN 暂不支持，国际化功能访问器，用于获取多语言字符串资源                                            |
| $rawOptions        | 是      | 访问组件原始选项对象                                      |
