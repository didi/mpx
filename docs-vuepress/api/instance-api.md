# 实例api

## $set

- **参数**：
  - `{Object | Array} target`
  - `{string | number} propertyName/index`
  - `{any} value`

- **返回值**：设置的值

- **用法**：

  这是全局 `mpx.set` 的别名。向响应式对象中添加一个 property，并确保这个新 property 同样是响应式的，且触发视图更新。
它必须用于向响应式对象上添加新 property，因为 Mpx 无法探测普通的新增 property (比如 this.myObject.newProperty = 'hi')

- **参考**：[mpx.set](global-api.html#set)

## $watch

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
- **选项**：pausable

    可在选项参数中指定 pausable: true 来声明一个可被暂停的 watcher，配置好之后可以通过 this.$getPausableWatchers() 来获取当前实例下所有可被暂停的 watcher，
    然后根据具体是业务场景通过 watcher.pause() 或者 watcher.resume() 来暂停或者恢复 watcher 的监听。
    比如说在小程序页面 hide 时不需要执行的 watch 可以配置为 pausable: true，在页面 hide 时调用 watcher.pause() 暂停监听，在页面 show 时调用 watcher.resume() 来恢复监听。

  ``` javascript
  this.$watch('someObject', callback, {
    pausable: true
  })

  const isHide = false
  const watchers = this.$getPausableWatchers()
  if (watchers && watchers.length) {
    for (let i = 0; i < watchers.length; i++) {
      const watcher = watchers[i]
      isHide && watcher.pause()
      !isHide && watcher.resume()
    }
  }
  ```
- **选项**：name

  为了方便获取用户定义的 watcher，可在选项参数中配置 name 来声明当前 watcher 的名称，配置好后可通过 this.$getWatcherByName(name) 在实例中获取当前 watcher（注意当存在多个 name 相同 watcher 时，this.$getWatcherByName 获取的是最后创建的 watcher。）

  ``` javascript
  this.$watch('someObject', callback, {
    name: 'someObject'
  })

  const someObjectWatch = this.$getWatcherByName('someObject')
  ```
- **参考**：[mpx.watch](global-api.html#watch)

## $delete
* **参数：** 
  * `{Object | Array} target`
  * `{string | number} propertyName/index`
* **用法：** 


  删除对象属性，如果该对象是响应式的，那么该方法可以触发观察器更新（视图更新 | watch回调）
* **示例：** 
  ``` js
    import {createComponent} from '@mpxjs/core'
    createComponent({
    data: {
      info: {
        name: 'a'
      }
    },
    watch: {
      'info' (val) {
        // 当删除属性之后会执行
        console.log(val)
      }
    },
    attached () {
      // 删除name属性
      this.$delete(this.info, 'name')
    }
    })
  ```
* **参考：** [Mpx.delete](global-api.html#delete)
## $refs
* **类型：** `Object`
* **详细：**


  一个对象，持有注册过 [ref](../api/directives.html#wx-ref)的所有 DOM 元素和组件实例，调用响应的组件方法或者获取视图节点信息。
* **示例**

 以获取组件为例，模版中引用child子组件

  ``` html
 <child wx:ref="childDom"></child>
  ```
  javascript 中可以调用组件的方法

  ```javascript
  import {createComponent} from '@mpxjs/core'
  createComponent({
  ready (){
    // 调用child中的方法
    this.$refs.childDom.childMethods()
    // 获取child中的data
    this.$refs.childDom.data
    },
  })
  ```
* **参考：**
  [组件 ref](../guide/basic/refs.html)
## $forceUpdate
* **参数：** 
  * `{Object} target`
  * `{Function} callback`
* **用法**
  

  用于强制刷新视图，正常情况下只有`发生了变化的数据`才会被发送到视图层进行渲染。强制更新时，会将某些数据强制发送到视图层渲染，无论是否发生了变化
* **示例**
  ``` js
    import {createComponent} from '@mpxjs/core'
    createComponent({
    data: {
      info: {
        name: 'a'
      },
      age: 100
    },
    attached () {
      // 虽然不会修改age的值，但仍会触发重新渲染，并且会将age发送到视图层
      this.$forceUpdate({
        age: 100
      }, () => {
        console.log('视图更新后执行')
      })

      // 也可用于正常的数据修改，key支持Path，数组可以使用'array[index]'：value的形式
      this.$forceUpdate({
        'info.name': 'b'
      }, () => {
        console.log('视图更新后执行')
      })
    }
    })
  ```
## $nextTick
* **参数：** 
  * `{Function} callback`
* **用法：** 
  
  
  将回调延迟到下次 DOM 更新循环之后执行。在修改数据之后立即使用它，然后等待 DOM 更新。**注意：`callback`中`this`并不是绑定当前实例，你可以使用箭头函数避免this指向问题**。
* **示例：** 
 ``` js
      import {createComponent} from '@mpxjs/core'
      createComponent({
      data: {
        info: {
          name: 1
        }
      },
      attached () {
        // 修改数据
        this.info.name = 2
        // DOM 还没有更新

        // this.$nextTick(function() {
        //   // DOM 现在更新了
        //   console.log('会在由name变化引起的视图更新之后执行')
        //   this.doSomthing() // 报错
        // })
        this.$nextTick(() => {
          // DOM 现在更新了
          console.log('会在由name变化引起的视图更新之后执行')
          this.doSomthing()
        })
      }
      })
  ```
## $i18n

* **用法：** 
 组件中直接调用$i18n的方法，比如：$t，$tc，$te，$d，$n
* **示例：** 

首先在`mpx.plugin.conf.js`中配置i18n
  ``` js
  module.exports = {

    //...

    i18n: {
      locale: 'en-US',
      // messages既可以通过对象字面量传入，也可以通过messagesPath指定一个js模块路径，在该模块中定义配置并导出，dateTimeFormats/dateTimeFormatsPath和numberFormats/numberFormatsPath同理
      messages: {
        'en-US': {
          message: {
            hello: '{msg} world'
          }
        },
        'zh-CN': {
          message: {
            hello: '{msg} 世界'
          }
        }
      }
    }
  }
  ```
  组件中直接使用
   ``` js

    <template>
      <view>{{$t('message.hello')}}</view>
    </template>
    
    import {createComponent} from '@mpxjs/core'
    createComponent({

    ready () {
       console.log(this.$t('message.hello', { msg: 'hello' }))
       console.log(this.$te('message.hello')) 
       //...
    }
    })
  ```
  ## $getRenderWatcher
* **用法：** 
  用来获取当前实例的 renderWatcher
* **示例：** 
 ``` js
import {createComponent} from '@mpxjs/core'
createPage({
  ready () {
    this.renderWatcher = this.getRenderWatcher()
  },
  show() {
    this.renderWatcher.resume()
  },
  hide() {
    this.renderWatcher.pause()
  }
})
  ```
  ## $getPausableWatchers
* **用法：** 
  用来获取当前实例中所有声明了 pausable: true 的 watcher，获取之后可在页面 hide 时调用 watcher.pause() 暂停监听，在页面 show 时调用 watcher.resume() 来恢复监听。
* **示例：** 
 ``` js
import {createComponent} from '@mpxjs/core'
createPage({
  watch: {
    locationPoi: {
      handler() {
      },
      pausable: true
    }
  },
  show() {
    this.setPausedWatch(false)
  },
  hide() {
    this.setPausedWatch(true)
  },
  methods: {
    setPausedWatch (isHide) {
      const watchers = this.$getPausableWatchers()
      if (watchers && watchers.length) {
        for (let i = 0; i < watchers.length; i++) {
          const watcher = watchers[i]
          isHide && watcher.pause()
          !isHide && watcher.resume()
        }
      }
    }
  }
})
  ```
* **参考：** 
   * [Vue I18n](http://kazupon.github.io/vue-i18n/api/#vue-constructor-options)
   * [国际化i18n](../guide/tool/i18n.html)
