# 使用原子类

原子类(utility-first CSS)是近几年流行起来的一种全新的样式编写方式，在前端开发社区内取得了良好的口碑，越来越多的主流网站也基于原子类进行开发，我们耳熟能详的有[Github](https://github.com/)，[OpenAI](https://openai.com/)，[Netflix](https://top10.netflix.com/)和[NASA官网](https://www.jpl.nasa.gov/)等。使用原子类离不开原子类框架的支持，常用的原子类框架有 [Tailwindcss](https://tailwindcss.com/)、[Windicss](https://windicss.org/) 和 [Unocss](https://unocss.dev/) 等，而在 **Mpx2.9** 以后，我们在框架中内置了基于 unocss 的原子类支持，让小程序开发也能使用原子类。对项目进行简单配置开启原子类支持后，用户就可以在 Mpx 页面/组件模板中直接使用一些预定义的基础样式类，诸如flex，pt-4，text-center 和 rotate-90 等，对样式进行组合定义，下面是一个简单示例：

```html
<view class="container">
  <view class="flex">
    <view class="py-8 px-8 inline-flex mx-auto bg-white rounded-xl shadow-md">
      <view class="text-center">
        <view class="text-base text-black font-semibold mb-2">
          Erin Lindford
        </view>
        <view class="text-gray-500 font-medium pb-3">
          Product Engineer
        </view>
        <view
          class="mt-2 px-4 py-1 text-sm text-purple-600 font-semibold rounded-full border border-solid border-purple-200">
          Message
        </view>
      </view>
    </view>
  </view>
</view>
```

通过这种方式，我们在不编写任何自定义样式代码的情况下得到了一张简单的个人卡片，实际渲染效果如下：

![utility-css-demo](https://dpubstatic.udache.com/static/dpubimg/Or3aaN-mmxV8pK-LmEVPm_demo.png)

相较于传统的自定义类编写样式的方式，使用原子类能给你带来以下这些好处：
- **不用再烦恼于为自定义类取类名**，传统样式开发中，我们仅仅是为某个元素定义样式就需要绞尽脑汁发明一些抽象的类名，还得提防类名冲突，使用原子类可以完全将你从这种琐碎无趣的工作中解放；
- **停止css体积的无序增长**，传统样式开发中，css体积会随着你的迭代不断增长，而在原子类中，一切样式都可以复用，你几乎不需要编写新的css；
- **让调整样式变得更加安全**，传统css是全局的，当你修改某个样式时无法保障其不会破坏其他地方的样式，而你在模板中使用的原子类是本地的，你完全不用担心修改它会影响其他地方。

而相较于使用内联样式，原子类也有一些重要的优势：
- **约束下的设计**，使用内联样式时，里面的每一个数值都是魔法数字(magic number)，而通过原子工具类，你可以选择一些符合预定义设计规范的样式，便于构筑具有视觉一致性的UI；
- **响应式设计**，你无法在内联样式中使用媒体查询，然而通过原子类框架中提供的响应式工具，你可以轻而易举地构建出响应式界面；
- **Hover、focus和其他状态**，使用内联样式无法定义特定状态下的样式，如hover和focus，通过原子类框架的状态变量能力，我们可以轻松为这些状态定义样式。

看到这里相信你已经迫不及待地想要在 Mpx 中体验原子类开发了吧，可以根据下面的指南开启你的原子类之旅。


## 原子类环境配置

如果你想在新项目中使用原子类，可以使用最新版本的 `@mpxjs/cli` 创建项目，在 prompt 中选择使用原子类，就可以在新创建的项目模版中直接使用 unocss 的原子类，关于可使用的工具类可参考 [unocss 交互示例](https://unocss.dev/interactive/) 及本指南下方的[工具类支持范围](#工具类支持范围)。

> 与 web 中使用 unocss 不同，在 Mpx 中使用 unocss 不需要显式引入虚拟模块 `import 'uno.css'` 来承载生成的样式内容，这是由于在 Mpx 中，我们充分考虑到小程序分包架构的特殊性和主包体积的重要性，结合 Mpx 强大的分包构建能力，对生成的原子工具类的使用情况进行分析，将其自动注入到合适的主包或者分包中，来达到全局体积分配的最优（在没有内容冗余的情况下尽可能输出到分包）。

对于使用 `@mpxjs/cli@3.0` 新版脚手架创建的项目，可以

对于使用旧版脚手架创建的项目，可以通过修改项目模板



## 功能支持范围

## 工具类支持范围

## 小程序原子类使用注意点

## 为什么使用unocss













