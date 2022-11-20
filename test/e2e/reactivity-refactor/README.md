# a-mpx

> A mpx project

## Dev

```bash
# install dep
npm i

# for dev
npm run watch

# for online
npm run build
```

npm script规范 [build|watch]:[dev|prod]:[cross|web|none]

build默认prod，watch默认dev。另单独提供了build:dev和watch:prod，用于单次构建分析看未压缩代码分析问题和持续压缩代码便于大体积项目真机调试。

建议自行调整cross的目标。npm-run-all是为了兼容windows下无法同时执行两个npm script，若不需要转web平台，可考虑去掉。




## MPX 中 Page 页面为啥要使用 Component 构造器来创建页面？由于小程序中没有 computed、watch 等概念，故使用 Component 自定义构造器需要自己实现

见：https://developers.weixin.qq.com/community/develop/article/doc/0000a8d54acaf0c962e820a1a5e413



<!-- 运行时依赖替换 -->

## 响应式系统重构————基于 Proxy

**流程：** getDefaultOptions => initProxy => context.__mpxProxy = new MpxProxy(rawOptions, context) => context.__mpxProxy.created()


**组件执行流程**

父组件 `created` (当前 `activeEffect` 为父组件，执行到 `this.initWatch()` 后， `activeEffect` 需要恢复原来的值。)  => 子组件 `created` =》

target dep Observer



```JS

export default Class MpxProxy {
    constructor(options, target, reCreated) {
        this.target = target
        this.reCreated = reCreated
        this.uid = uid++
        this.name = options.name || ''
        this.options = options
        // beforeCreate -> created -> mounted -> unmounted
        this.state = BEFORECREATE
        this.ignoreProxyMap = makeMap(Mpx.config.ignoreProxyWhiteList)
        // 收集setup中动态注册的hooks，小程序与web环境都需要
        this.hooks = {}
        if (__mpx_mode__ !== 'web') {
        // effectScope 是用来干嘛的，没搞懂？？
        this.scope = effectScope(true)
        // props响应式数据代理
        this.props = {}
        // data响应式数据代理
        this.data = {}
        // 非props key
        this.localKeysMap = {}
        // 渲染函数中收集的数据
        this.renderData = {}
        // 最小渲染数据
        this.miniRenderData = {}
        // 强制更新的数据
        this.forceUpdateData = {}
        // 下次是否需要强制更新全部渲染数据
        this.forceUpdateAll = false
        this.currentRenderTask = null
        }
        this.initApi()
        this.callHook(BEFORECREATE)
    }
    created () {
        if (__mpx_mode__ !== 'web') {
            // 设置当前 activeEffectScope。
            setCurrentInstance(this)
            this.initProps()
            this.initSetup()
            this.initData()
            this.initComputed()
            this.initWatch()
            unsetCurrentInstance()
        }

        this.state = CREATED
        this.callHook(CREATED)

        if (__mpx_mode__ !== 'web') {
            this.initRender()
        }

        if (this.reCreated) {
            nextTick(this.mounted.bind(this))
        }
    }
}
```

### this.initProps()做了什么？？ 

调用 reactive，将其变成响应式对象。

[![zkcatK.md.png](https://s1.ax1x.com/2022/11/14/zkcatK.md.png)](https://imgse.com/i/zkcatK)


```JS
this.initProps()
```

<!-- initProps会将 this.props 对象变成响应式对象，内部构造__ob__属性，并对 this.props 对象的属性代理到this.target 上（组件实例），即 this.a 的值即为 this.props.a 的值 -->

```JS
this.props = {
    __ob__: Observer {
        dep: Dep {id: 0, subs: Array(0)}
        value: {__ob__: Observer}
    }
}
```


### this.initData()做了什么？？

同样调用 reactive，将其变成响应式对象。

```JS
this.initData()
```

```JS
this.data = {
    __ob__: Observer {
        dep: Dep {id: 1, subs: Array(0)}
        value: {__ob__: Observer}
    },
    info: {
        address: 'shaoxing',
        __ob__: Observer {
            dep: Dep {id: 4, subs: Array(0)}
            value: {__ob__: Observer}
        },
    },
    name: 'jack'
}
```


### 暂不关心以下

```JS
    this.initComputed()
    this.initWatch()
    // activeEffect 需要恢复原来的值。
    unsetCurrentInstance()
```


### 执行 initRender

```JS
    if (__mpx_mode__ !== 'web') {
      this.initRender()
    }

    initRender () {
        if (this.options.__nativeRender__) return this.doRender()

        this.effect = new ReactiveEffect(() => {
        if (this.target.__injectedRender) {
            try {
            return this.target.__injectedRender()
            } catch (e) {
            warn('Failed to execute render function, degrade to full-set-data mode.', this.options.mpxFileResource, e)
            this.render()
            }
        } else {
            this.render()
        }
        }, () => queueJob(update), this.scope)

        const update = this.effect.run.bind(this.effect)
        update.id = this.uid
        update()
    }
```


```JS
scope = new EffectScope()

scope.effects.push(effect: ReactiveEffect)

this.scope = effectScope(true)
```


target = {
    name: {
        subs: []
    }
}