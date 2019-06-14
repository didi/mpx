## Page & Component 新增的实例方法

### this.$watch

用于动态添加watch，返回值是一个destroy函数，执行返回函数用于销毁watch

##### 参数选项

- **`this.$watch(expr | function, callback, options?: Object) : function`**

``` js
import {createComponent} from '@mpxjs/core'
createComponent({
  data: {
    info: {
      name: 1
    }
  },
  attached () {
    // 微信小程序生命周期
    // 第一个参数为变量表达式
    const unwatch1 = this.$watch('info.name', (val, old) => {
      console.log(val, old)
    }, {
      // deep: true,
      // sync: true,
      immediate: true // watch options
    })
    unwatch1() // 销毁watch，不再观察

    // 第一个参数也可以为函数
    this.$watch(function() {
      return this.info.name
    }, (val, old) => {
      console.log(val, old)
    }, {
      // deep: true,
      // sync: true,
      immediate: true // watch options
    })
  }
})
```

### $nextTick

接收一个函数，保证在小程序渲染更新之后执行回调

``` js
import {createComponent} from '@mpxjs/core'
createComponent({
  data: {
    info: {
      name: 1
    }
  },
  attached () {
    this.info.name = 2
    this.$nextTick(() => {
      console.log('会在由name变化引起的视图更新之后执行')
    })
  }
})
```

### $updated

已被废弃，请使用this.$nextTick代替

### $forceUpdate

##### 参数选项

- **`this.$forceUpdate(data?: Object, callback?: function)`**

用于强制刷新视图，正常情况下```只有发生了变化的数据```才会被发送到视图层进行渲染。强制更新时，会将某些数据强制发送到视图层渲染，无论是否发生了变化

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

    // 也可用于正常的数据修改，key支持path
    this.$forceUpdate({
      'info.name': 'b'
    }, () => {
      console.log('视图更新后执行')
    })

    // 如果不传入任何数据，那么默认情况下会将data & computed 所有数据都传入视图层进行渲染
    this.$forceUpdate(() => {
      console.log('视图更新后执行')
    })
  }
})
```

### $set、$remove

正常情况下，对一个响应式数据的新增属性或者删除数据操作是没法感知的，通过 `this.$set、this.$remove` 可以动态添加或删除属性，并且会触发观察器更新（视图更新 | watch回调）

``` js
import {createComponent} from '@mpxjs/core'
createComponent({
  data: {
    info: {
      name: 'a'
    }
  },
  watch: {
    'info.age' (val) {
      // 当新增age属性之后执行
      console.log(val)
    },
    'info' (val) {
      // 当新增或删除属性之后都会执行
      console.log(val)
    }
  },
  attached () {
    // 新增age属性
    this.$set(this.info, 'age', 100)
    // 删除name属性
    this.$remove(this.info, 'name')
  }
})
```