# 实例api

## this.$set

- **参数**：
  - `{Object | Array} target`
  - `{string | number} propertyName/index`
  - `{any} value`

- **返回值**：设置的值

- **用法**：

  这是全局 `Mpx.set` 的别名。向响应式对象中添加一个 property，并确保这个新 property 同样是响应式的，且触发视图更新。
它必须用于向响应式对象上添加新 property，因为 Mpx 无法探测普通的新增 property (比如 this.myObject.newProperty = 'hi')

- **参考**：[Mpx.set](global-api.html#set)

## this.$watch

- **参数**：
  - `{string | Function} expOrFn` 
  - `{Function | Object} callback`
  - `{Object} [options]`
    - `{boolean} deep`
    - `{boolean} immediate`

- **返回值**：{Function} unwatch

- **用法**：

  观察 Mpx 实例上的一个表达式或者一个函数计算结果的变化。回调函数得到的参数为新值和旧值。表达式只接受监督的键路径。对于更复杂的表达式，用一个函数取代。

- **示例**：

  ``` javascript
  // 键路径
  this.$watch('a.b.c', function (newVal, oldVal) {
    // 做点什么
  })

  // 函数
  this.$watch(
    function () {
      // 表达式 `this.a + this.b` 每次得出一个不同的结果时
      // 处理函数都会被调用。
      // 这就像监听一个未被定义的计算属性
      return this.a + this.b
    },
    function (newVal, oldVal) {
      // 做点什么
    }
  )
  ```

  `this.$watch` 返回一个取消观察函数，用来停止触发回调：

  ``` javascript
  var unwatch = this.$watch('a', cb)
  // 之后取消观察
  unwatch()
  ```

- **选项**：deep

  为了发现对象内部值的变化，可以在选项参数中指定 deep: true。注意监听数组的变更不需要这么做。

  ``` javascript
  this.$watch('someObject', callback, {
    deep: true
  })
  this.someObject.nestedValue = 123
  // callback is fired
  ```

- **选项**：immediate

  在选项参数中指定 `immediate: true` 将立即以表达式的当前值触发回调：

  ``` javascript
  this.$watch('a', callback, {
    immediate: true
  })
  // 立即以 `a` 的当前值触发回调
  ```
  注意在带有 immediate 选项时，你不能在第一次回调时取消侦听给定的 property。
  ``` javascript
  // 这会导致报错
  var unwatch = this.$watch(
    'value',
    function () {
      doSomething()
      unwatch()
    },
    { immediate: true }
  )
  ```
  如果你仍然希望在回调内部调用一个取消侦听的函数，你应该先检查其函数的可用性：
  ``` javascript
  var unwatch = this.$watch(
    'value',
    function () {
      doSomething()
      if (unwatch) {
        unwatch()
      }
    },
    { immediate: true }
  )
  ```

## $remove

## $delete

## $refs

## $forceUpdate

## $nextTick

## $i18n
