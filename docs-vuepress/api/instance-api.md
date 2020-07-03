# 实例api

## $set

## $watch

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
## $refs
* **类型：** `Object`
* **只读**
* **详细：**


  一个对象，持有注册过 [ref directive](../api/directives.html#wx-ref)的所有 DOM 元素和组件实例。
* **参考：**
  * [组件 ref](../guide/basic/refs.html)
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
 组件中直接调用$i18n的方法，比如：$t，$tc，$te，$d，$n，具体可以参考
  * [Vue I18n](http://kazupon.github.io/vue-i18n/api/#vue-constructor-options)
  * [国际化i18n](../guide/tool/i18n.html)
