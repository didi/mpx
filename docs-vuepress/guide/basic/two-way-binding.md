# 双向绑定

Mpx针对表单组件提供了`wx:model`双向绑定指令，类似于`v-model`，该指令是一个语法糖指令，监听了组件抛出的输入事件并对绑定的数据进行更新，默认情况下会监听表单组件的`input`事件，并将`event.detail.value`中的数据更新到组件的`value`属性上。

简单实用示例如下：

```html
<view>
  <input type="text" wx:model="{{message}}"/>
  <!--view中的文案会随着用户对输入框进行输入而实时更新-->
  <view>{{message}}</view>
</view>
```

## 对自定义组件使用

对自定义组件使用双向绑定时用法与原生小程序组件完全一致

```html
<view>
  <custom-input type="text" wx:model="{{message}}"/>
  <!--此处的文案会随着输入框输入实时更新-->
  <view>{{message}}</view>
</view>
```


## 更改双向绑定的监听事件及数据属性

如前文所述，`wx:model`指令默认监听组件抛出的`input`事件，并将声明的数据绑定到组件的`value`属性上，该行为在一些原生组件和自定义组件上并不成立，因为这些组件可能不存在`input`事件或`value`属性。对此，我们提供了`wx:model-event`和`wx:model-prop`指令来修改双向绑定的监听事件和数据属性，使用示例如下：

```html
<view>
  <!--原生组件picker中没有input事件，通过wx:model-event指令将双向绑定监听事件改为change事件-->
  <picker mode="selector" range="{{countryRange}}" wx:model="{{country}}" wx:model-event="change">
    <view class="picker">
      当前选择: {{country}}
    </view>
  </picker>
  <!--通过wx:model-event和wx:model-prop将该自定义组件的双向绑定监听事件和数据属性修改为customInput/customValue-->
  <custom-input wx:model="{{message}}" wx:model-event="customInput" wx:model-prop="customValue"/>
  <view>{{message}}</view>
</view>
```

## 更改双向绑定事件数据路径

Mpx中双向绑定默认使用event对象中的`event.detail.value`作为用户输入来更新组件数据，该行为在一些原生组件和自定义组件中也不成立，例如vant中的field输入框组件，用户的输入直接存储在`event.detail`当中，当然用户也可以将其存放在detail中的其他数据路径下，对此，我们提供了`wx:model-value-path`指令让用户声明在事件当中应该访问的数据路径。

由于小程序triggerEvent的Api设计，事件的用户数据都只能存放在`event.detail`中，因此`wx:model-value-path`的值都是相对于`event.detail`的数据路径，我们支持两种形式进行声明：
* 一种是点语法，如传入`current.value`时框架会从`event.detail.current.value`中取值作为用户输入，为空字符串时`wx:model-value-path=""`代表直接使用`event.detail`作为用户输入；
* 第二种是数组字面量的JSON字符串，如`["current", "value"]`与上面的`current.value`等价，传入`[]`时与上面的空字符串等价。

使用示例如下：

```html
<view>
  <!--wx:model-value-path传入[]直接使用event.detail作为用户输入，使vant-field中双向绑定能够生效-->
  <van-field wx:model="{{username}}" wx:model-value-path="[]" label="用户名" placeholder="请输入用户名"/>
</view>
```

## 双向绑定过滤器

用户可以使用`wx:model-filter`指令定义双向绑定过滤器，在修改数据之前对用户输入进行过滤，来实现特定的效果，框架内置了`trim`过滤器对用户输入进行trim操作，传入其他字符串时会使用当前组件中的同名方法作为自定义过滤器，使用示例如下：

```html
<view>
  <!--以下示例中，用户输入的首尾空格将被过滤-->
  <input wx:model="{{message}}" wx:model-filter="trim"/>
  <view>{{message}}</view>
</view>
```




